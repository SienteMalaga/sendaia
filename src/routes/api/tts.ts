import { createFileRoute } from "@tanstack/react-router";

// Selecciona la voz Aura-2 según el idioma detectado.
function voiceFor(lang: string): string {
  const l = (lang || "es").toLowerCase().slice(0, 2);
  switch (l) {
    case "en":
      return "aura-2-thalia-en";
    case "es":
    default:
      return "aura-2-celeste-es";
  }
}

export const Route = createFileRoute("/api/tts")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = process.env.DEEPGRAM_API_KEY;
        if (!apiKey) {
          return Response.json({ error: "DEEPGRAM_API_KEY no configurada" }, { status: 500 });
        }
        let body: { text?: string; model?: string; language?: string };
        try {
          body = await request.json();
        } catch {
          return Response.json({ error: "JSON inválido" }, { status: 400 });
        }
        const text = (body.text ?? "").toString().slice(0, 1800).trim();
        if (!text) {
          return Response.json({ error: "Texto vacío" }, { status: 400 });
        }
        const model = body.model ?? voiceFor(body.language ?? "es");
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
          return Response.json(
            { error: `Deepgram ${dgRes.status}: ${errTxt.slice(0, 300)}` },
            { status: 502 },
          );
        }
        // Stream directo (sin bufferizar) para reducir latencia.
        return new Response(dgRes.body, {
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
