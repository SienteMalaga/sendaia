import { createFileRoute } from "@tanstack/react-router";

const SYSTEM_PROMPT = `Eres un INGENIERO MECÁNICO EXPERTO en automoción con 30 años de experiencia en taller y oficina técnica. Conoces a fondo TODAS las marcas y modelos de coches (europeos, asiáticos, americanos), motores gasolina/diésel/híbridos/eléctricos, cajas de cambios, electrónica, suspensión, frenos, climatización y diagnosis OBD-II.

Responde SIEMPRE en español, con tono profesional, directo y cercano de maestro de taller. Estructura tu respuesta de forma clara y útil para un operario o conductor:

🔧 **Diagnóstico:** Causa probable de la avería o explicación técnica breve.
🛠️ **Solución / Procedimiento:** Pasos concretos y accionables, numerados si aplica.
⚙️ **Datos técnicos:** Pares de apriete, capacidades, intervalos o referencias si el modelo lo requiere.
💡 **Consejo del maestro:** Truco veterano, aviso de seguridad o recomendación práctica.

Sé preciso, evita rodeos teóricos. Si te preguntan por un modelo concreto (ej. "Golf 7 TDI 2015"), adapta los datos a ese modelo. Si la consulta no es de automoción, recondúcela amablemente al ámbito mecánico.`;

export const Route = createFileRoute("/api/maestro")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = process.env.LOVABLE_API_KEY;
        if (!apiKey) {
          return new Response("LOVABLE_API_KEY no configurada", { status: 500 });
        }
        let body: { consulta?: string };
        try {
          body = await request.json();
        } catch {
          return new Response("JSON inválido", { status: 400 });
        }
        const consulta = (body.consulta ?? "").toString().trim().slice(0, 1000);
        if (consulta.length < 2) {
          return new Response("Consulta vacía", { status: 400 });
        }

        const upstream = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-3-flash-preview",
            stream: true,
            messages: [
              { role: "system", content: SYSTEM_PROMPT },
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
            connection: "keep-alive",
          },
        });
      },
    },
  },
});
