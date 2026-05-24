import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useEffect, useMemo, useState } from "react";
import { Search, Volume2, Car, Factory, Wrench } from "lucide-react";
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

function Biblioteca() {
  const [consejos, setConsejos] = useState<Consejo[]>([]);
  const [q, setQ] = useState("");

  useEffect(() => {
    setConsejos(loadConsejos());
  }, []);

  const grupos = useMemo(() => {
    const filtrados = consejos.filter((c) => {
      const t = q.toLowerCase();
      return (
        c.problema.toLowerCase().includes(t) ||
        c.solucion.toLowerCase().includes(t) ||
        c.autor.toLowerCase().includes(t)
      );
    });
    const map = new Map<Categoria, Consejo[]>();
    for (const c of filtrados) {
      const arr = map.get(c.categoria) ?? [];
      arr.push(c);
      map.set(c.categoria, arr);
    }
    return Array.from(map.entries());
  }, [consejos, q]);

  const escuchar = (texto: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const u = new SpeechSynthesisUtterance(texto);
    u.lang = "es-ES";
    speechSynthesis.cancel();
    speechSynthesis.speak(u);
  };

  return (
    <AppShell>
      <header className="px-5 pt-10 pb-4">
        <span className="text-xs font-semibold uppercase tracking-widest text-primary">
          Biblioteca
        </span>
        <h1 className="mt-1 text-2xl font-bold">Consejos guardados</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          El saber del taller, ordenado y a tu alcance.
        </p>
      </header>

      <div className="px-5">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar problema, autor o palabra clave…"
            className="w-full rounded-full border border-border bg-card py-3 pl-10 pr-4 text-sm shadow-soft outline-none focus:border-primary"
          />
        </div>
      </div>

      <div className="mt-6 space-y-6 px-5">
        {grupos.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            Sin resultados.
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
                <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">
                  {cat}
                </h2>
                <span className="text-xs text-muted-foreground">({items.length})</span>
              </div>
              <div className="space-y-3">
                {items.map((c) => (
                  <article
                    key={c.id}
                    className="rounded-2xl border border-border bg-card p-4 shadow-soft"
                  >
                    <h3 className="font-bold text-foreground">{c.problema}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-foreground/90">
                      {c.solucion}
                    </p>
                    <div className="mt-3 flex items-center justify-between gap-2">
                      <span className="text-xs font-medium text-success">
                        ✓ {c.autor}
                      </span>
                      <button
                        onClick={() => escuchar(c.solucion)}
                        className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 text-xs font-semibold text-secondary-foreground hover:bg-accent"
                      >
                        <Volume2 className="h-3.5 w-3.5" />
                        Escuchar
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </AppShell>
  );
}
