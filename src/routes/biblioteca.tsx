import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useEffect, useMemo, useRef, useState } from "react";
import { Search, Car, Factory, Wrench, Sparkles, Loader2, ChevronRight, Send } from "lucide-react";
import { loadConsejos, type Categoria, type Consejo } from "@/lib/consejos";

export const Route = createFileRoute("/biblioteca")({
  head: () => ({
    meta: [
      { title: "Biblioteca de Conocimiento — Senda-IA" },
      { name: "description", content: "Consejos de maestros mecánicos y operarios industriales." },
    ],
  }),
  component: Biblioteca,
});

const iconos: Record<Categoria, typeof Car> = {
  "Mecánica de Coches": Car,
  "Maquinaria Industrial": Factory,
  "Mecánica General": Wrench,
};

const IDIOMAS = [
  { code: "es", label: "Español" },
  { code: "en", label: "English" },
  { code: "fr", label: "Français" },
  { code: "de", label: "Deutsch" },
  { code: "ar", label: "العربية" },
] as const;
type IdiomaCode = (typeof IDIOMAS)[number]["code"];

function Biblioteca() {
  const [consejos, setConsejos] = useState<Consejo[]>([]);
  const [q, setQ] = useState("");
  const [idioma, setIdioma] = useState<IdiomaCode>("es");
  const [consultaActiva, setConsultaActiva] = useState("");
  const [respuesta, setRespuesta] = useState("");
  const [cargando, setCargando] = useState(false);
  const [errMsg, setErrMsg] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    setConsejos(loadConsejos());
    return () => abortRef.current?.abort();
  }, []);

  const grupos = useMemo(() => {
    const t = q.toLowerCase().trim();
    const filtrados = !t
      ? consejos
      : consejos.filter(
          (c) =>
            c.problema.toLowerCase().includes(t) ||
            c.solucion.toLowerCase().includes(t) ||
            c.autor.toLowerCase().includes(t),
        );
    const map = new Map<Categoria, Consejo[]>();
    for (const c of filtrados) {
      const arr = map.get(c.categoria) ?? [];
      arr.push(c);
      map.set(c.categoria, arr);
    }
    return Array.from(map.entries());
  }, [consejos, q]);

  async function preguntarMaestro() {
    const texto = q.trim();
    if (texto.length < 2) {
      setErrMsg("Escribe una consulta antes de buscar.");
      return;
    }
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    setErrMsg(null);
    setRespuesta("");
    setConsultaActiva(texto);
    setCargando(true);

    try {
      const res = await fetch("/api/maestro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ consulta: texto, idioma }),
        signal: ctrl.signal,
      });
      if (!res.ok || !res.body) {
        const t = await res.text().catch(() => "");
        throw new Error(t || `Error ${res.status}`);
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const raw of lines) {
          const line = raw.trim();
          if (!line.startsWith("data:")) continue;
          const data = line.slice(5).trim();
          if (!data || data === "[DONE]") continue;
          try {
            const json = JSON.parse(data);
            if (json.error) throw new Error(json.error);
            if (typeof json.t === "string") {
              setRespuesta((prev) => prev + json.t);
            }
          } catch (e) {
            if ((e as Error).message) throw e;
          }
        }
      }
    } catch (e) {
      if ((e as Error).name !== "AbortError") {
        setErrMsg((e as Error)?.message ?? "No se pudo consultar al maestro.");
      }
    } finally {
      setCargando(false);
    }
  }

  const totalLocal = grupos.reduce((acc, [, items]) => acc + items.length, 0);

  return (
    <AppShell>
      <header className="px-5 pt-10 pb-4">
        <span className="text-xs font-semibold uppercase tracking-widest text-primary">
          Biblioteca
        </span>
        <h1 className="mt-1 text-2xl font-bold">Maestro IA en automoción</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Pregunta cualquier avería, modelo o mantenimiento. Pulsa Enter o el botón para consultar.
        </p>
      </header>

      <div className="px-5">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void preguntarMaestro();
          }}
          className="flex items-center gap-2"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Ej. Golf 7 TDI no arranca, ruido en frenos…"
              className="w-full rounded-full border border-border bg-card py-3 pl-10 pr-4 text-sm shadow-soft outline-none focus:border-primary"
            />
          </div>
          <button
            type="submit"
            disabled={cargando}
            className="inline-flex items-center gap-1 rounded-full bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-soft transition hover:opacity-90 disabled:opacity-50"
          >
            {cargando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            <span className="hidden sm:inline">Preguntar</span>
          </button>
        </form>
      </div>

      {(consultaActiva || cargando || respuesta || errMsg) && (
        <section className="mt-6 px-5">
          <div className="mb-2 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-bold uppercase tracking-wider">
              Maestro IA · {consultaActiva}
            </h2>
          </div>
          {errMsg ? (
            <div className="rounded-2xl border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
              {errMsg}
            </div>
          ) : (
            <div className="rounded-2xl border border-border bg-card p-4 shadow-soft">
              <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground">
                {respuesta}
                {cargando && <span className="ml-0.5 inline-block animate-pulse">▍</span>}
              </pre>
              {!cargando && respuesta && (
                <div className="mt-3 text-xs font-medium text-success">
                  ✓ Generado por Senda-IA (Ingeniero Mecánico Experto)
                </div>
              )}
            </div>
          )}
        </section>
      )}

      <div className="mt-8 space-y-6 px-5">
        <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">
          Saber del taller {totalLocal > 0 && <span className="text-muted-foreground">({totalLocal})</span>}
        </h2>
        {grupos.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            Sin consejos guardados todavía.
          </div>
        )}
        {grupos.map(([cat, items]) => {
          const Icon = iconos[cat];
          return (
            <section key={cat}>
              <div className="mb-2 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-4 w-4" />
                </div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
                  {cat}
                </h3>
                <span className="text-xs text-muted-foreground">({items.length})</span>
              </div>
              <div className="space-y-3">
                {items.map((c) => (
                  <Link
                    key={c.id}
                    to="/detalle/$tema"
                    params={{ tema: encodeURIComponent(c.problema) }}
                    className="block rounded-2xl border border-border bg-card p-4 shadow-soft transition hover:border-primary hover:bg-primary/5"
                  >
                    <h4 className="font-bold text-foreground">{c.problema}</h4>
                    <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-foreground/90">
                      {c.solucion}
                    </p>
                    <div className="mt-3 flex items-center justify-between gap-2">
                      <span className="text-xs font-medium text-success">✓ {c.autor}</span>
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary">
                        Ver ficha <ChevronRight className="h-3.5 w-3.5" />
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </AppShell>
  );
}
