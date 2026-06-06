import { createFileRoute } from "@tanstack/react-router";

const IDIOMAS: Record<string, string> = {
  es: "Español",
  en: "English",
};

function buildSystemPrompt(idiomaNombre: string) {
  return `You are a senior international business & operations expert / Eres un consultor senior internacional. Domains: mechanics, industry, manufacturing, logistics, retail, hospitality, technology, finance, marketing, HR, legal basics, healthcare ops, agriculture, construction, services. Any company, any country.

=== LANGUAGE RULE — HIGHEST PRIORITY ===
1. Detect the language of the USER MESSAGE.
2. Reply 100% in that EXACT same language. Every word, including the section titles.
3. If user writes English → answer FULLY in English.
4. If user writes Spanish → answer FULLY in Spanish.
5. NEVER mix languages. NEVER translate back.
6. Only if the message is 1-2 ambiguous words, fall back to ${idiomaNombre}.

MAX 70 words. No greetings, no intros. Translate the section titles to the response language (e.g. "Diagnosis"/"Diagnóstico", "Solution"/"Solución", "Tip"/"Consejo").

Format:
🔧 **<Diagnosis label>:** 1 short sentence.
🛠️ **<Solution label>:** 2-3 very brief numbered steps.
💡 **<Tip label>:** 1 sentence.`;
}

export const Route = createFileRoute("/api/maestro")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = process.env.LOVABLE_API_KEY;
        if (!apiKey) {
          return new Response("LOVABLE_API_KEY no configurada", { status: 500 });
        }
        let body: { consulta?: string; idioma?: string };
        try {
          body = await request.json();
        } catch {
          return new Response("JSON inválido", { status: 400 });
        }
        const consulta = (body.consulta ?? "").toString().trim().slice(0, 1000);
        if (consulta.length < 2) {
          return new Response("Consulta vacía", { status: 400 });
        }
        const idiomaCode = (body.idioma ?? "es").toString().toLowerCase();
        const idiomaNombre = IDIOMAS[idiomaCode] ?? "Español";

        const upstream = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            // Modelo más ligero y rápido posible para minimizar latencia
            model: "google/gemini-3.1-flash-lite-preview",
            stream: true,
            max_tokens: 160,
            temperature: 0.2,
            messages: [
              { role: "system", content: buildSystemPrompt(idiomaNombre) },
              { role: "user", content: consulta },
            ],
          }),
        });

        if (!upstream.ok || !upstream.body) {
          const txt = await upstream.text().catch(() => "");
          if (upstream.status === 429) {
            return new Response("Demasiadas consultas, espera un momento.", { status: 429 });
          }
          if (upstream.status === 402) {
            return new Response("Sin créditos de IA. Añade saldo al espacio de trabajo.", {
              status: 402,
            });
          }
          return new Response(`Error IA (${upstream.status}): ${txt.slice(0, 200)}`, {
            status: 502,
          });
        }

        const encoder = new TextEncoder();
        const decoder = new TextDecoder();
        const reader = upstream.body.getReader();

        const stream = new ReadableStream({
          async start(controller) {
            let buffer = "";
            try {
              while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split("\n");
                buffer = lines.pop() ?? "";
                for (const raw of lines) {
                  const line = raw.trim();
                  if (!line.startsWith("data:")) continue;
                  const data = line.slice(5).trim();
                  if (!data || data === "[DONE]") continue;
                  try {
                    const json = JSON.parse(data);
                    const token: string | undefined = json?.choices?.[0]?.delta?.content;
                    if (token) {
                      controller.enqueue(
                        encoder.encode(`data: ${JSON.stringify({ t: token })}\n\n`),
                      );
                    }
                  } catch {
                    // ignore malformed chunk
                  }
                }
              }
              controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
            } catch (e) {
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({ error: (e as Error).message })}\n\n`,
                ),
              );
            } finally {
              controller.close();
            }
          },
        });

        return new Response(stream, {
          status: 200,
          headers: {
            "content-type": "text/event-stream; charset=utf-8",
            "cache-control": "no-store, no-transform",
            "x-accel-buffering": "no",
            connection: "keep-alive",
          },
        });
      },
    },
  },
});
