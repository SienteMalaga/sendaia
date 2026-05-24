export type Categoria = "Mecánica de Coches" | "Maquinaria Industrial" | "Mecánica General";

export interface Consejo {
  id: string;
  problema: string;
  solucion: string;
  autor: string;
  categoria: Categoria;
}

export const consejosIniciales: Consejo[] = [
  {
    id: "1",
    problema: "Tornillo del cárter atascado",
    solucion:
      "No lo fuerces de golpe. Dale un golpe seco con el martillo de teflón en el sentido de las agujas del reloj para asentar la rosca, y luego afloja hacia la izquierda poco a poco.",
    autor: "Paco Román (Maestro Mecánico, Málaga)",
    categoria: "Mecánica de Coches",
  },
  {
    id: "2",
    problema: "Prensa hidráulica hace un silbido al bajar",
    solucion:
      "Pérdida de presión en la junta tórica. Detén la máquina inmediatamente en el botón de emergencia para evitar dañar el retén.",
    autor: "Manuel Benítez (Jefe de Planta, Polígono Guadalhorce)",
    categoria: "Maquinaria Industrial",
  },
  {
    id: "3",
    problema: "Cómo revisar el desgaste de la correa de distribución",
    solucion:
      "Pasa el dedo por la parte interna. Si notas tacto cristalizado o grietas milimétricas al trasluz, cámbiala ya. Con el calor de Málaga sufren más.",
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
