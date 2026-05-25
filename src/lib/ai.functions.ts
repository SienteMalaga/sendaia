import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

type AIResp = {
  titulo: string;
  diagnostico: string;
  solucion: string;
  consejoMaestro: string;
};

async function callAI(consulta: string, idiomaNombre: string): Promise<AIResp> {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) throw new Error("LOVABLE_API_KEY no configurada");

  const system = `Eres un MAESTRO MECÁNICO VETERANO con 40 años de taller. Responde SIEMPRE en ${idiomaNombre} con tono cercano, directo y profesional de taller. Da consejos cortos, prácticos y accionables. Nada de teoría ni rodeos. Habla como un maestro que enseña a un aprendiz.`;

  const body = {
    model: "google/gemini-3-flash-preview",
    messages: [
      { role: "system", content: system },
      { role: "user", content: consulta },
    ],
    tools: [
      {
        type: "function",
        function: {
          name: "ficha_maestro",
          description: "Consejo de maestro mecánico veterano.",
          parameters: {
            type: "object",
            properties: {
              titulo: { type: "string", description: "Título corto (máx 6 palabras)." },
              diagnostico: { type: "string", description: "UNA frase con la causa (máx 18 palabras)." },
              solucion: { type: "string", description: "Pasos directos y accionables, 2-3 frases cortas." },
              consejoMaestro: { type: "string", description: "Truco o aviso veterano (máx 18 palabras)." },
            },
            required: ["titulo", "diagnostico", "solucion", "consejoMaestro"],
            additionalProperties: false,
          },
        },
      },
    ],
    tool_choice: { type: "function", function: { name: "ficha_maestro" } },
  };

  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const txt = await res.text();
    if (res.status === 429) throw new Error("Demasiadas consultas, espera un momento.");
    if (res.status === 402) throw new Error("Sin créditos de IA. Añade saldo en el espacio de trabajo.");
    throw new Error(`Error IA (${res.status}): ${txt.slice(0, 200)}`);
  }

  const data = await res.json();
  const call = data?.choices?.[0]?.message?.tool_calls?.[0];
  if (!call?.function?.arguments) throw new Error("Respuesta IA vacía");
  return JSON.parse(call.function.arguments) as AIResp;
}

export const consultarMaestro = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      consulta: z.string().min(2).max(500),
      idioma: z.string().min(2).max(20).default("Español"),
    }).parse,
  )
  .handler(async ({ data }) => {
    const ai = await callAI(data.consulta, data.idioma);
    return { ...ai, autor: "Generado por Senda-IA (Conocimiento Experto)" };
  });
