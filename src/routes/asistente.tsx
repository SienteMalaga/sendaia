import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Mic, Volume2, Sparkles } from "lucide-react";
import { useState } from "react";
import { loadConsejos, type Consejo } from "@/lib/consejos";

export const Route = createFileRoute("/asistente")({
  head: () => ({
    meta: [
      { title: "Asistente de Voz — Senda-IA" },
      { name: "description", content: "Asistente de diagnóstico por voz multilingüe." },
    ],
  }),
  component: Asistente,
});

const idiomas = [
  { code: "es", label: "Español" },
  { code: "en", label: "English" },
  { code: "fr", label: "Français" },
  { code: "de", label: "Deutsch" },
  { code: "ar", label: "العربية" },
];

const consultasSimuladas = [
  "¿Cómo aflojo un tornillo del cárter atascado?",
  "Mi prensa hidráulica silba al bajar",
  "¿Cómo sé si la correa de distribución está gastada?",
];

function Asistente() {
  const [idioma, setIdioma] = useState("es");
  const [escuchando, setEscuchando] = useState(false);
  const [respuesta, setRespuesta] = useState<Consejo | null>(null);
  const [consulta, setConsulta] = useState<string | null>(null);

  const handleHablar = () => {
    setEscuchando(true);
    setRespuesta(null);
    const consejos = loadConsejos();
    const idx = Math.floor(Math.random() * Math.min(consejos.length, 3));
    const q = consultasSimuladas[idx] ?? consultasSimuladas[0];
    setTimeout(() => {
      setConsulta(q);
      setRespuesta(consejos[idx] ?? consejos[0]);
      setEscuchando(false);
    }, 1600);
  };

  const escucharConsejo = (texto: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const u = new SpeechSynthesisUtterance(texto);
    u.lang = idioma === "es" ? "es-ES" : idioma;
    speechSynthesis.cancel();
    speechSynthesis.speak(u);
  };

  return (
    <AppShell>
      <header className="px-5 pt-10 pb-4">
        <div className="flex items-center gap-2 text-primary">
          <Sparkles className="h-4 w-4" />
          <span className="text-xs font-semibold uppercase tracking-widest">Asistente IA</span>
        </div>
        <h1 className="mt-1 text-2xl font-bold">Diagnóstico por voz</h1>
        <p className="mt-1 text-sm text-muted-foreground">Pulsa, habla en tu idioma y escucha al maestro.</p>
      </header>

      <section className="px-5">
        <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Idioma
        </label>
        <div className="flex flex-wrap gap-2">
          {idiomas.map((i) => (
            <button
              key={i.code}
              onClick={() => setIdioma(i.code)}
              className={`rounded-full border px-3 py-1.5 text-sm transition ${
                idioma === i.code
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-foreground hover:border-primary/40"
              }`}
            >
              {i.label}
            </button>
          ))}
        </div>
      </section>

      <section className="mt-10 flex flex-col items-center px-5">
        <button
          onClick={handleHablar}
          disabled={escuchando}
          className={`relative flex h-44 w-44 items-center justify-center rounded-full text-primary-foreground shadow-card transition active:scale-95 ${
            escuchando ? "animate-pulse" : ""
          }`}
          style={{ background: "var(--gradient-hero)" }}
        >
          {escuchando && (
            <span className="absolute inset-0 animate-ping rounded-full bg-primary/30" />
          )}
          <Mic className="h-16 w-16" />
        </button>
        <p className="mt-4 text-center text-sm font-medium text-muted-foreground">
          {escuchando ? "Escuchando…" : "Pulsar para Hablar"}
        </p>
      </section>

      {respuesta && (
        <section className="mt-8 px-5">
          {consulta && (
            <div className="mb-3 rounded-2xl bg-secondary p-3 text-sm text-secondary-foreground">
              <span className="font-semibold">Tu consulta: </span>
              {consulta}
            </div>
          )}
          <article className="rounded-2xl border border-border bg-card p-5 shadow-card">
            <div className="text-xs font-semibold uppercase tracking-wider text-primary">
              {respuesta.categoria}
            </div>
            <h3 className="mt-1 text-lg font-bold text-foreground">{respuesta.problema}</h3>
            <p className="mt-2 text-[15px] leading-relaxed text-foreground">
              {respuesta.solucion}
            </p>

            <button
              onClick={() => escucharConsejo(respuesta.solucion)}
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-soft transition hover:opacity-90"
            >
              <Volume2 className="h-4 w-4" />
              Escuchar Consejo
            </button>

            <div className="mt-4 rounded-xl bg-success/10 px-3 py-2 text-xs font-medium text-success">
              ✓ Consejo validado por el maestro: {respuesta.autor}
            </div>
          </article>
        </section>
      )}
    </AppShell>
  );
}
