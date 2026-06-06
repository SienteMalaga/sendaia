import { createFileRoute } from "@tanstack/react-router";

const IDIOMAS: Record<string, string> = {
  es: "Español",
  en: "English",
};

function buildSystemPrompt(idiomaNombre: string) {
  return `Ingeniero mecánico experto. Responde SIEMPRE en ${idiomaNombre} (o en el idioma del usuario si es claro). MÁXIMO 60 palabras. Sin saludos ni introducciones.

Formato:
🔧 **Diagnóstico:** 1 frase corta.
🛠️ **Solución:** 2 pasos numerados muy breves.
💡 **Consejo:** 1 frase.`;
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
