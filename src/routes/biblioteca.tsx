import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useEffect, useMemo, useState } from "react";
import { Search, Car, Factory, Wrench, Sparkles, Loader2, ChevronRight } from "lucide-react";
import { loadConsejos, type Categoria, type Consejo } from "@/lib/consejos";
import { consultarMaestro } from "@/lib/ai.functions";

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

type Sugerencia = { titulo: string; categoria: string; autor: string };

function Biblioteca() {
  const [consejos, setConsejos] = useState<Consejo[]>([]);
  const [q, setQ] = useState("");
  const [sugerencias, setSugerencias] = useState<Sugerencia[]>([]);
  const [cargando, setCargando] = useState(false);
  const [errMsg, setErrMsg] = useState<string | null>(null);

  useEffect(() => {
    setConsejos(loadConsejos());
  }, []);

  // Búsqueda local en los consejos guardados
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

  // Generación dinámica con IA cuando el usuario busca algo nuevo
  useEffect(() => {
    const texto = q.trim();
    setErrMsg(null);
    if (texto.length < 4) {
      setSugerencias([]);
      return;
    }
    const handle = setTimeout(async () => {
      setCargando(true);
      try {
        const r = await consultarMaestro({ data: { consulta: texto, idioma: "Español" } });
        setSugerencias([{ titulo: r.titulo, categoria: "Generado por IA", autor: r.autor }]);
      } catch (e) {
        setErrMsg((e as Error)?.message ?? "No se pudo consultar al maestro.");
        setSugerencias([]);
      } finally {
        setCargando(false);
      }
    }, 700);
    return () => clearTimeout(handle);
  }, [q]);


  const totalLocal = grupos.reduce((acc, [, items]) => acc + items.length, 0);

  return (
    <AppShell>
      <header className="px-5 pt-10 pb-4">
        <span className="text-xs font-semibold uppercase tracking-widest text-primary">
          Biblioteca
        </span>
        <h1 className="mt-1 text-2xl font-bold">Consejos guardados</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Busca cualquier avería: si no está, el maestro IA la genera para ti.
        </p>
      </header>

      <div className="px-5">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Ej. humo blanco motor, alternador, fresadora…"
            className="w-full rounded-full border border-border bg-card py-3 pl-10 pr-4 text-sm shadow-soft outline-none focus:border-primary"
          />
        </div>
      </div>

      {/* Sugerencias generadas por IA */}
      {q.trim().length >= 4 && (
        <section className="mt-6 px-5">
          <div className="mb-2 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-bold uppercase tracking-wider">
              Resultados del maestro IA
            </h2>
          </div>
          {cargando ? (
            <div className="flex items-center gap-2 rounded-2xl border border-dashed border-border p-4 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              Generando ficha para "{q}"…
            </div>
          ) : errMsg ? (
            <div className="rounded-2xl border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
              {errMsg}
            </div>
          ) : (
            <div className="space-y-2">
              {sugerencias.map((s) => (
                <Link
                  key={s.titulo}
                  to="/detalle/$tema"
                  params={{ tema: encodeURIComponent(s.titulo) }}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4 shadow-soft transition hover:border-primary hover:bg-primary/5"
                >
                  <div className="min-w-0">
                    <div className="truncate font-semibold text-foreground">{s.titulo}</div>
                    <div className="mt-0.5 text-xs text-muted-foreground">
                      {s.categoria} · ✓ {s.autor}
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-primary" />
                </Link>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Casos guardados */}
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
