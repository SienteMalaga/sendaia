import { createFileRoute } from "@tanstack/react-router";

const IDIOMAS: Record<string, string> = {
  es: "Español",
  en: "English",
  fr: "Français",
  de: "Deutsch",
  ar: "Arabic (العربية)",
};

function buildSystemPrompt(idiomaNombre: string) {
  return `Eres un INGENIERO MECÁNICO EXPERTO en automoción. Tono directo de maestro de taller.

IDIOMA (REGLA ABSOLUTA): Detecta el idioma de la consulta del usuario y RESPONDE SIEMPRE EN ESE MISMO IDIOMA, incluso si difiere del idioma preferido (${idiomaNombre}). Si la consulta es ambigua o muy corta, usa ${idiomaNombre}. Nunca mezcles idiomas.

ULTRA BREVE: máximo 90 palabras totales. Sin introducciones. Al grano.

Formato EXACTO (traduce los títulos al idioma de respuesta):

🔧 **Diagnóstico:** 1 frase.
🛠️ **Solución:** 2-3 pasos numerados muy cortos.
💡 **Consejo:** 1 frase.

Si no es de automoción, recondúcela en 1 frase.`;
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
            // Modelo ligero y rápido para minimizar latencia (TTFB y velocidad de streaming)
            model: "google/gemini-2.5-flash-lite",
            stream: true,
            max_tokens: 280,
            temperature: 0.3,
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
