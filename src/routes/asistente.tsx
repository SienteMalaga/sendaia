import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Mic, Sparkles, Database, Bot, Loader2, Volume2, VolumeX } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { consultarMaestro } from "@/lib/ai.functions";
import { loadConsejos, type Consejo } from "@/lib/consejos";

export const Route = createFileRoute("/asistente")({
  head: () => ({
    meta: [
      { title: "Asistente de Voz — Senda-IA" },
      { name: "description", content: "Asistente híbrido: base del maestro + IA experta." },
    ],
  }),
  component: Asistente,
});

type Resultado =
  | { fuente: "consejo"; titulo: string; diagnostico: string; solucion: string; consejoMaestro?: string; autor: string }
  | { fuente: "ia"; titulo: string; diagnostico: string; solucion: string; consejoMaestro: string; autor: string };

const IDIOMAS = [
  { code: "es", label: "Español", nombre: "Español" },
  { code: "en", label: "English", nombre: "English" },
  { code: "fr", label: "Français", nombre: "Français" },
  { code: "de", label: "Deutsch", nombre: "Deutsch" },
  { code: "ar", label: "العربية", nombre: "Arabic" },
] as const;

type IdiomaCode = (typeof IDIOMAS)[number]["code"];

function normalizar(t: string) {
  return t.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function buscarConsejo(consulta: string, consejos: Consejo[]): Consejo | null {
  const q = normalizar(consulta);
  const palabras = q.split(/\s+/).filter((p) => p.length >= 4);
  if (palabras.length === 0) return null;
  let mejor: { c: Consejo; score: number } | null = null;
  for (const c of consejos) {
    const texto = normalizar(`${c.problema} ${c.solucion}`);
    let score = 0;
    for (const p of palabras) if (texto.includes(p)) score++;
    if (score > 0 && (!mejor || score > mejor.score)) mejor = { c, score };
  }
  return mejor?.c ?? null;
}

function Asistente() {
  const [idioma, setIdioma] = useState<IdiomaCode>("es");
  const [consulta, setConsulta] = useState("");
  const [escuchando, setEscuchando] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [consultaMostrada, setConsultaMostrada] = useState("");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);
  const [narrando, setNarrando] = useState(false);
  const [audioActivo, setAudioActivo] = useState(true);
  const consultar = useServerFn(consultarMaestro);

  const detenerAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current = null;
    }
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }
    setNarrando(false);
  };

  const narrar = async (texto: string) => {
    try {
      detenerAudio();
      setNarrando(true);
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: texto }),
      });
      if (!res.ok) throw new Error(`TTS ${res.status}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      audioUrlRef.current = url;
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => setNarrando(false);
      audio.onerror = () => setNarrando(false);
      await audio.play();
    } catch {
      setNarrando(false);
    }
  };

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); detenerAudio(); }, []);

  useEffect(() => {
    if (!resultado || !audioActivo) return;
    const partes = [
      `Diagnóstico: ${resultado.diagnostico}.`,
      `Solución: ${resultado.solucion}.`,
      resultado.fuente === "ia" && resultado.consejoMaestro ? `Truco del maestro: ${resultado.consejoMaestro}.` : "",
      `Validado por ${resultado.autor}.`,
    ].filter(Boolean).join(" ");
    narrar(partes);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resultado]);



  const idiomaNombre = IDIOMAS.find((i) => i.code === idioma)?.nombre ?? "Español";

  const procesar = async (texto: string, origen: "voz" | "texto" = "texto") => {
    let limpio = texto.trim();
    if (!limpio) {
      if (origen === "texto") {
        setError("Escribe o di tu consulta antes de buscar.");
        return;
      }
      // Voz sin transcripción: usar una consulta demo para no fallar nunca
      limpio = "cómo cambiar el aceite del motor";
    }
    setError("");
    setResultado(null);
    setConsulta(limpio);
    setConsultaMostrada(limpio);

    const match = buscarConsejo(limpio, loadConsejos());
    if (match) {
      setResultado({
        fuente: "consejo",
        titulo: match.problema,
        diagnostico: match.problema,
        solucion: match.solucion,
        autor: match.autor,
      });
      return;
    }

    setCargando(true);
    try {
      const r = await consultar({ data: { consulta: limpio, idioma: idiomaNombre } });
      setResultado({
        fuente: "ia",
        titulo: r.titulo,
        diagnostico: r.diagnostico,
        solucion: r.solucion,
        consejoMaestro: r.consejoMaestro,
        autor: r.autor,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al consultar al maestro.");
    } finally {
      setCargando(false);
    }
  };

  const handleHablar = () => {
    if (escuchando || cargando) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    setError("");
    setResultado(null);
    setConsultaMostrada("");
    setEscuchando(true);
    timerRef.current = setTimeout(() => {
      setEscuchando(false);
      procesar(consulta, "voz");

    }, 3000);
  };

  return (
    <AppShell>
      <header className="px-5 pt-10 pb-4">
        <div className="flex items-center gap-2 text-primary">
          <Sparkles className="h-4 w-4" />
          <span className="text-xs font-semibold uppercase tracking-widest">Asistente IA híbrido</span>
        </div>
        <h1 className="mt-1 text-2xl font-bold">Diagnóstico inteligente</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Primero busca en la base de maestros. Si no hay coincidencia, Senda-IA genera el consejo.
        </p>
      </header>

      <section className="px-5">
        <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Idioma</label>
        <div className="flex flex-wrap gap-2">
          {IDIOMAS.map((i) => (
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

      <section className="mt-8 flex flex-col items-center px-5">
        <button
          onClick={handleHablar}
          disabled={escuchando || cargando}
          className={`relative flex h-32 w-32 items-center justify-center rounded-full text-primary-foreground shadow-card transition active:scale-95 disabled:opacity-90 ${
            escuchando ? "animate-pulse" : ""
          }`}
          style={{
            background: escuchando
              ? "linear-gradient(135deg, #ef4444, #b91c1c)"
              : "var(--gradient-hero)",
          }}
        >
          {escuchando && (
            <>
              <span className="absolute inset-0 animate-ping rounded-full bg-red-500/40" />
              <span className="absolute -inset-2 animate-ping rounded-full bg-red-500/20 [animation-delay:200ms]" />
            </>
          )}
          <Mic className="h-12 w-12" />
        </button>
        <p className="mt-3 text-center text-sm font-medium text-muted-foreground">
          {escuchando ? "Escuchando..." : "Pulsar para Hablar"}
        </p>
      </section>

      <section className="mt-6 px-5">
        <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Tu consulta (voz o texto)
        </label>
        <textarea
          value={consulta}
          onChange={(e) => setConsulta(e.target.value)}
          placeholder="Ej. cómo limpiar un carburador / qué herramientas para cambiar una bujía / silbido en la prensa"
          rows={3}
          className="w-full resize-none rounded-2xl border border-border bg-card px-4 py-3 text-sm text-foreground shadow-soft outline-none transition placeholder:text-muted-foreground focus:border-primary"
        />
        <button
          onClick={() => procesar(consulta)}
          disabled={cargando || escuchando}
          className="mt-3 w-full rounded-full bg-primary py-3 text-sm font-semibold text-primary-foreground shadow-soft transition hover:opacity-90 disabled:opacity-60"
        >
          {cargando ? (
            <span className="inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Consultando al maestro...</span>
          ) : (
            "Consultar al maestro"
          )}
        </button>
      </section>

      {(consultaMostrada || resultado || error) && (
        <section className="mt-6 px-5 animate-fade-in" dir={idioma === "ar" ? "rtl" : "ltr"}>
          {consultaMostrada && (
            <div className="mb-3 rounded-2xl bg-secondary p-3 text-sm text-secondary-foreground">
              <span className="font-semibold">Tu consulta: </span>{consultaMostrada}
            </div>
          )}

          {error && (
            <div className="rounded-2xl border border-destructive/40 bg-destructive/10 p-4 text-sm font-semibold text-destructive">
              {error}
            </div>
          )}

          {resultado && (
            <article className="space-y-3 rounded-2xl border border-border bg-card p-5 text-[15px] leading-relaxed shadow-card">
              <div className="flex items-center justify-between gap-2 text-xs font-semibold uppercase tracking-wider">
                <div className="flex items-center gap-2">
                  {resultado.fuente === "consejo" ? (
                    <><Database className="h-3.5 w-3.5 text-primary" /><span className="text-primary">Consejo del maestro (base)</span></>
                  ) : (
                    <><Bot className="h-3.5 w-3.5 text-primary" /><span className="text-primary">Generado por Senda-IA</span></>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (narrando) { detenerAudio(); return; }
                    setAudioActivo(true);
                    const partes = [
                      `Diagnóstico: ${resultado.diagnostico}.`,
                      `Solución: ${resultado.solucion}.`,
                      resultado.fuente === "ia" && resultado.consejoMaestro ? `Truco del maestro: ${resultado.consejoMaestro}.` : "",
                      `Validado por ${resultado.autor}.`,
                    ].filter(Boolean).join(" ");
                    narrar(partes);
                  }}
                  className="inline-flex items-center gap-1 rounded-full border border-border bg-secondary px-2.5 py-1 text-[10px] text-secondary-foreground hover:border-primary/40"
                  aria-label={narrando ? "Detener narración" : "Escuchar narración"}
                >
                  {narrando ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
                  {narrando ? "Detener" : "Escuchar"}
                </button>
              </div>

              <h2 className="text-lg font-bold">{resultado.titulo}</h2>
              <p><span className="font-bold">Diagnóstico: </span>{resultado.diagnostico}</p>
              <p><span className="font-bold">Solución: </span>{resultado.solucion}</p>
              {resultado.fuente === "ia" && resultado.consejoMaestro && (
                <p><span className="font-bold">Truco del maestro: </span>{resultado.consejoMaestro}</p>
              )}
              <p className="border-t border-border pt-3 text-sm text-muted-foreground">
                <span className="font-semibold">Validado por: </span>{resultado.autor}
              </p>
            </article>
          )}
        </section>
      )}
    </AppShell>
  );
}
