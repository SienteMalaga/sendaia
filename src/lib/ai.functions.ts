import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const MAESTROS = [
  "Juan Pérez (Maestro Mecánico, Sevilla)",
  "Paco Román (Maestro Mecánico, Málaga)",
  "Manuel Benítez (Jefe de Planta, Polígono Guadalhorce)",
  "María José Suárez (Especialista en Motores)",
  "Antonio Cabrera (Tornero Industrial, Bilbao)",
  "Rafael Molina (Electromecánico, Valencia)",
  "Lola Carmona (Maestra Diésel, Cádiz)",
  "Ginés Martínez (Soldador Industrial, Cartagena)",
  "Curro Vega (Maestro Carrocero, Jerez)",
  "Pepe Almagro (Hidráulica Pesada, Linares)",
];

function pickMaestro() {
  return MAESTROS[Math.floor(Math.random() * MAESTROS.length)];
}

type AIResp = {
  titulo: string;
  categoria: string;
  diagnostico: string;
  pasos: string[];
  consejoMaestro: string;
  relacionados: string[];
};

async function callAI(consulta: string, idiomaNombre: string): Promise<AIResp> {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) throw new Error("LOVABLE_API_KEY no configurada");

  const system = `Eres un maestro mecánico veterano que enseña a aprendices. Recibes una duda técnica sobre mecánica de coches o maquinaria industrial y respondes SIEMPRE en ${idiomaNombre} con lenguaje claro, cercano y de taller (sin tecnicismos innecesarios), pero técnicamente correcto. Devuelve SIEMPRE una ficha estructurada usando la herramienta proporcionada.`;

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
          name: "ficha_tecnica",
          description: "Genera una ficha técnica clara para el aprendiz.",
          parameters: {
            type: "object",
            properties: {
              titulo: { type: "string", description: "Título corto del problema (máx 8 palabras)." },
              categoria: {
                type: "string",
                enum: ["Mecánica de Coches", "Maquinaria Industrial", "Mecánica General"],
              },
              diagnostico: {
                type: "string",
                description: "Diagnóstico claro en 2-3 frases con lenguaje de taller.",
              },
              pasos: {
                type: "array",
                description: "Pasos concretos para solucionarlo, en orden.",
                items: { type: "string" },
                minItems: 3,
                maxItems: 7,
              },
              consejoMaestro: {
                type: "string",
                description: "Truco o aviso del veterano, una frase con sabor humano.",
              },
              relacionados: {
                type: "array",
                description: "3-5 averías o consultas relacionadas que un aprendiz buscaría después.",
                items: { type: "string" },
                minItems: 3,
                maxItems: 5,
              },
            },
            required: ["titulo", "categoria", "diagnostico", "pasos", "consejoMaestro", "relacionados"],
            additionalProperties: false,
          },
        },
      },
    ],
    tool_choice: { type: "function", function: { name: "ficha_tecnica" } },
  };

  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
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
  const parsed = JSON.parse(call.function.arguments);
  return parsed as AIResp;
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
    return { ...ai, autor: pickMaestro() };
  });
