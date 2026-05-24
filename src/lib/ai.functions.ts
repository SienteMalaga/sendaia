import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const MAESTROS = [
  "Juan Pérez (Maestro Mecánico, Sevilla)",
  "Paco Román (Mecánica Málaga)",
  "Manuel Benítez (Polígono Guadalhorce)",
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

type CasoFijo = AIResp & { autor: string };

// Atajos instantáneos: si la consulta contiene estas palabras clave,
// devolvemos la ficha al instante sin llamar a la IA (latencia ~0).
function matchAtajo(consultaRaw: string): CasoFijo | null {
  const c = consultaRaw.toLowerCase();
  const has = (...ws: string[]) => ws.some((w) => c.includes(w));

  if (has("arranca", "arranque", "coche", "motor de arranque") && !has("humo", "aceite", "correa")) {
    return {
      titulo: "El coche no arranca",
      categoria: "Mecánica de Coches",
      diagnostico: "Fallo en bornes sulfatados o escobillas del motor de arranque pegadas.",
      pasos: [
        "Limpia los bornes de la batería con agua y bicarbonato.",
        "Si sigue sin arrancar, da tres golpes secos al motor de arranque con una llave fija mientras giras la llave.",
      ],
      consejoMaestro: "Antes de cambiar nada, escobillas y bornes: el 80% de las veces es eso.",
      relacionados: ["Batería descargada en frío", "Cambiar motor de arranque", "Alternador no carga"],
      autor: "Paco Román (Mecánica Málaga)",
    };
  }

  if (has("prensa", "silbido", "hidráulica", "hidraulica")) {
    return {
      titulo: "Silbido en prensa hidráulica",
      categoria: "Maquinaria Industrial",
      diagnostico: "Fuga de presión por desgaste en la junta tórica principal.",
      pasos: [
        "Para la máquina ya con el botón de emergencia.",
        "Sustituye la junta de goma antes de que dañe el retén del pistón.",
      ],
      consejoMaestro: "Si la dejas trabajando con silbido, el retén se va y la reparación se multiplica por diez.",
      relacionados: ["Cambiar retén de pistón", "Purgar aceite hidráulico", "Calibrar válvula de presión"],
      autor: "Manuel Benítez (Polígono Guadalhorce)",
    };
  }

  if (has("correa", "distribución", "distribucion")) {
    return {
      titulo: "Desgaste de correa de distribución",
      categoria: "Mecánica General",
      diagnostico: "Desgaste térmico y cristalización del caucho.",
      pasos: [
        "Gira la correa y pasa el dedo por los dientes internos.",
        "Si ves grietas milimétricas o brilla como cristal, cámbiala de inmediato; con el calor de Málaga rompen antes.",
      ],
      consejoMaestro: "Una correa rota se lleva por delante el motor entero. No la apures.",
      relacionados: ["Cambiar kit de distribución", "Tensor de correa flojo", "Bomba de agua con holgura"],
      autor: "María José Suárez (Especialista en Motores)",
    };
  }

  return null;
}

async function callAI(consulta: string, idiomaNombre: string): Promise<AIResp> {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) throw new Error("LOVABLE_API_KEY no configurada");

  const system = `Eres un maestro mecánico veterano. Responde SIEMPRE en ${idiomaNombre} con formato ULTRA-CONCISO de acción inmediata.

REGLAS ESTRICTAS:
- "diagnostico": UNA SOLA FRASE corta (máx 15 palabras). Causa raíz, sin rodeos.
- "pasos": MÁXIMO 2 pasos directos y accionables. Frases cortas, imperativas. NO expliques teoría.
- "consejoMaestro": UNA frase con sabor de taller (máx 15 palabras).
- Sin introducciones, sin "lo primero que debes hacer", sin advertencias genéricas.
- Lenguaje claro de taller, técnicamente correcto.`;

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
          name: "ficha_rapida",
          description: "Ficha de acción inmediata ultra-concisa.",
          parameters: {
            type: "object",
            properties: {
              titulo: { type: "string", description: "Título corto (máx 6 palabras)." },
              categoria: {
                type: "string",
                enum: ["Mecánica de Coches", "Maquinaria Industrial", "Mecánica General"],
              },
              diagnostico: {
                type: "string",
                description: "UNA frase corta con la causa raíz (máx 15 palabras).",
              },
              pasos: {
                type: "array",
                description: "Máximo 2 pasos directos y accionables.",
                items: { type: "string" },
                minItems: 1,
                maxItems: 2,
              },
              consejoMaestro: {
                type: "string",
                description: "Una frase de taller (máx 15 palabras).",
              },
              relacionados: {
                type: "array",
                description: "3 averías relacionadas, títulos cortos.",
                items: { type: "string" },
                minItems: 3,
                maxItems: 3,
              },
            },
            required: ["titulo", "categoria", "diagnostico", "pasos", "consejoMaestro", "relacionados"],
            additionalProperties: false,
          },
        },
      },
    ],
    tool_choice: { type: "function", function: { name: "ficha_rapida" } },
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
    // Atajo instantáneo solo en español (los casos demo están en es-ES)
    if (data.idioma.toLowerCase().startsWith("esp")) {
      const atajo = matchAtajo(data.consulta);
      if (atajo) return atajo;
    }
    const ai = await callAI(data.consulta, data.idioma);
    return { ...ai, autor: pickMaestro() };
  });
