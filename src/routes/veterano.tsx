import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useState } from "react";
import { Mic, Save, CheckCircle2, Square } from "lucide-react";
import { saveConsejo, type Categoria } from "@/lib/consejos";

export const Route = createFileRoute("/veterano")({
  head: () => ({
    meta: [
      { title: "Panel del Veterano — Senda-IA" },
      { name: "description", content: "Captura de experiencia: graba tus trucos de taller." },
    ],
  }),
  component: Veterano,
});

function Veterano() {
  const [nombre, setNombre] = useState("");
  const [categoria, setCategoria] = useState<Categoria>("Mecánica de Coches");
  const [problema, setProblema] = useState("");
  const [solucion, setSolucion] = useState("");
  const [grabando, setGrabando] = useState(false);
  const [tiempo, setTiempo] = useState(0);
  const [guardado, setGuardado] = useState(false);

  const toggleGrabar = () => {
    if (grabando) {
      setGrabando(false);
      return;
    }
    setGrabando(true);
    setTiempo(0);
    const interval = setInterval(() => {
      setTiempo((t) => {
        if (t >= 30) {
          clearInterval(interval);
          setGrabando(false);
          return t;
        }
        return t + 1;
      });
    }, 1000);
  };

  const handleGuardar = () => {
    if (!nombre.trim() || !problema.trim() || !solucion.trim()) return;
    saveConsejo({
      autor: nombre,
      categoria,
      problema,
      solucion,
    });
    setGuardado(true);
    setProblema("");
    setSolucion("");
    setTiempo(0);
    setTimeout(() => setGuardado(false), 2500);
  };

  return (
    <AppShell>
      <header className="px-5 pt-10 pb-4">
        <span className="text-xs font-semibold uppercase tracking-widest text-primary">
          Panel del Veterano
        </span>
        <h1 className="mt-1 text-2xl font-bold">Tu experiencia importa</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Cuenta tus trucos. Estamos protegiendo tu legado.
        </p>
      </header>

      <section className="space-y-4 px-5">
        <div>
          <label className="mb-1 block text-sm font-semibold text-foreground">
            Nombre del Operario
          </label>
          <input
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej. Paco Román, Maestro Mecánico"
            className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm shadow-soft outline-none focus:border-primary"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-semibold text-foreground">Categoría</label>
          <div className="grid grid-cols-2 gap-2">
            {(["Mecánica de Coches", "Maquinaria Industrial"] as Categoria[]).map((c) => (
              <button
                key={c}
                onClick={() => setCategoria(c)}
                className={`rounded-xl border px-3 py-3 text-sm font-medium transition ${
                  categoria === c
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-card text-foreground"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-semibold text-foreground">Problema</label>
          <input
            value={problema}
            onChange={(e) => setProblema(e.target.value)}
            placeholder="Ej. Tornillo del cárter atascado"
            className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm shadow-soft outline-none focus:border-primary"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-semibold text-foreground">
            Solución / Truco
          </label>
          <textarea
            value={solucion}
            onChange={(e) => setSolucion(e.target.value)}
            placeholder="Explícalo con tus palabras, como se lo dirías a un aprendiz."
            rows={4}
            className="w-full resize-none rounded-xl border border-border bg-card px-4 py-3 text-sm shadow-soft outline-none focus:border-primary"
          />
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 shadow-soft">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-semibold">Audio del consejo</span>
            <span className="text-xs text-muted-foreground">
              {tiempo > 0 ? `${tiempo}s` : "Opcional"}
            </span>
          </div>
          <button
            onClick={toggleGrabar}
            className={`flex w-full items-center justify-center gap-2 rounded-xl py-4 text-base font-semibold text-primary-foreground transition ${
              grabando ? "bg-destructive" : ""
            }`}
            style={!grabando ? { background: "var(--gradient-hero)" } : undefined}
          >
            {grabando ? (
              <>
                <Square className="h-5 w-5 fill-current" /> Detener Grabación
              </>
            ) : (
              <>
                <Mic className="h-5 w-5" /> Grabar Audio
              </>
            )}
          </button>
        </div>

        <button
          onClick={handleGuardar}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-success py-4 text-base font-semibold text-success-foreground shadow-card transition hover:opacity-90"
        >
          <Save className="h-5 w-5" /> Guardar en la Base de Datos
        </button>

        {guardado && (
          <div className="flex items-center gap-2 rounded-xl bg-success/15 px-4 py-3 text-sm font-medium text-success">
            <CheckCircle2 className="h-5 w-5" />
            Consejo guardado. ¡Gracias, maestro!
          </div>
        )}
      </section>
    </AppShell>
  );
}
