import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/tts")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = process.env.DEEPGRAM_API_KEY;
        if (!apiKey) {
          return new Response(JSON.stringify({ error: "DEEPGRAM_API_KEY no configurada" }), {
            status: 500,
            headers: { "content-type": "application/json" },
          });
        }
        let body: { text?: string; model?: string; lang?: string };
        try {
          body = await request.json();
        } catch {
          return new Response(JSON.stringify({ error: "JSON inválido" }), {
            status: 400,
            headers: { "content-type": "application/json" },
          });
        }
        const text = (body.text ?? "").toString().slice(0, 1800).trim();
        if (!text) {
          return new Response(JSON.stringify({ error: "Texto vacío" }), {
            status: 400,
            headers: { "content-type": "application/json" },
          });
        }
        // Selección de voz según idioma detectado en el texto o pasado por el cliente
        const detectLang = (t: string): "en" | "es" => {
          const sample = t.toLowerCase();
          const esHits = (sample.match(/\b(el|la|los|las|de|que|para|con|una|por|del|es|está|cómo|qué|aceite|motor|coche|frenos|diagnóstico|solución|consejo)\b/g) ?? []).length;
          const enHits = (sample.match(/\b(the|and|to|of|for|with|is|are|how|what|engine|car|oil|brakes|diagnosis|solution|tip|step)\b/g) ?? []).length;
          if (enHits > esHits) return "en";
          if (esHits > enHits) return "es";
          // sin acentos ni ñ → probablemente inglés
          return /[áéíóúñ¿¡]/.test(sample) ? "es" : "en";
        };
        const lang = body.lang === "en" || body.lang === "es" ? body.lang : detectLang(text);
        const model = body.model ?? (lang === "en" ? "aura-asteria-en" : "aura-2-celeste-es");
        const dgRes = await fetch(
          `https://api.deepgram.com/v1/speak?model=${encodeURIComponent(model)}&encoding=mp3`,
          {
            method: "POST",
            headers: {
              Authorization: `Token ${apiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ text }),
          },
        );
        if (!dgRes.ok) {
          const errTxt = await dgRes.text();
          return new Response(
            JSON.stringify({ error: `Deepgram ${dgRes.status}: ${errTxt.slice(0, 300)}` }),
            { status: 502, headers: { "content-type": "application/json" } },
          );
        }
        const audio = await dgRes.arrayBuffer();
        return new Response(audio, {
          status: 200,
          headers: {
            "content-type": "audio/mpeg",
            "cache-control": "no-store",
          },
        });
      },
    },
  },
});
