import { createFileRoute } from "@tanstack/react-router";

// Deepgram STT con detección automática de idioma.
// Recibe audio binario (cualquier formato soportado: webm, ogg, mp3, wav).
// Devuelve { transcript, language }.
export const Route = createFileRoute("/api/stt")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = process.env.DEEPGRAM_API_KEY;
        if (!apiKey) {
          return Response.json({ error: "DEEPGRAM_API_KEY no configurada" }, { status: 500 });
        }
        const contentType = request.headers.get("content-type") ?? "audio/webm";
        const audio = await request.arrayBuffer();
        if (!audio || audio.byteLength < 200) {
          return Response.json({ error: "Audio vacío o demasiado corto" }, { status: 400 });
        }
        const params = new URLSearchParams({
          model: "nova-3",
          detect_language: "true",
          smart_format: "true",
          punctuate: "true",
        });
        const dgRes = await fetch(`https://api.deepgram.com/v1/listen?${params.toString()}`, {
          method: "POST",
          headers: {
            Authorization: `Token ${apiKey}`,
            "Content-Type": contentType,
          },
          body: audio,
        });
        if (!dgRes.ok) {
          const errTxt = await dgRes.text();
          return Response.json(
            { error: `Deepgram ${dgRes.status}: ${errTxt.slice(0, 300)}` },
            { status: 502 },
          );
        }
        const data = (await dgRes.json()) as {
          results?: {
            channels?: Array<{
              detected_language?: string;
              alternatives?: Array<{ transcript?: string }>;
            }>;
          };
        };
        const ch = data?.results?.channels?.[0];
        const transcript = ch?.alternatives?.[0]?.transcript?.trim() ?? "";
        const language = ch?.detected_language ?? "es";
        return Response.json({ transcript, language });
      },
    },
  },
});
