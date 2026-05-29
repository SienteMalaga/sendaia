export type Categoria = "Mecánica de Coches" | "Maquinaria Industrial" | "Mecánica General";

export interface Consejo {
  id: string;
  problema: string;
  solucion: string;
  autor: string;
  categoria: Categoria;
  audioUrl?: string;
}

export const consejosIniciales: Consejo[] = [
  {
    id: "1",
    problema: "El coche no arranca",
    solucion:
      "Bornes sulfatados o escobillas pegadas. Limpia los bornes con agua y bicarbonato; si sigue sin arrancar, da tres golpes secos al motor de arranque con una llave fija mientras giras la llave.",
    autor: "Paco Román (Mecánica Málaga)",
    categoria: "Mecánica de Coches",
  },
  {
    id: "2",
    problema: "Silbido en prensa hidráulica",
    solucion:
      "Fuga de presión por desgaste en la junta tórica principal. Para la máquina ya con el botón de emergencia y sustituye la junta antes de que dañe el retén del pistón.",
    autor: "Manuel Benítez (Polígono Guadalhorce)",
    categoria: "Maquinaria Industrial",
  },
  {
    id: "3",
    problema: "Desgaste de correa de distribución",
    solucion:
      "Cristalización térmica del caucho. Gira la correa y pasa el dedo por los dientes internos: si ves grietas milimétricas o brilla como cristal, cámbiala ya; con el calor de Málaga rompen antes.",
    autor: "María José Suárez (Especialista en Motores)",
    categoria: "Mecánica General",
  },
];

const STORAGE_KEY = "senda-ia-consejos";

export function loadConsejos(): Consejo[] {
  if (typeof window === "undefined") return consejosIniciales;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(consejosIniciales));
      return consejosIniciales;
    }
    return JSON.parse(raw);
  } catch {
    return consejosIniciales;
  }
}

export function saveConsejo(c: Omit<Consejo, "id">): Consejo {
  const all = loadConsejos();
  const nuevo: Consejo = { ...c, id: Date.now().toString() };
  const updated = [nuevo, ...all];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return nuevo;
}
