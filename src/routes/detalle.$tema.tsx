import { createFileRoute, Link, useParams, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { consultarMaestro } from "@/lib/ai.functions";
import type { Consejo } from "@/lib/consejos";
import { ArrowLeft, Volume2, ShieldCheck, Sparkles, Loader2 } from "lucide-react";

export const Route = createFileRoute("/detalle/$tema")({
  head: ({ params }) => ({
    meta: [
      { title: `${decodeURIComponent(params.tema)} — Senda-IA` },
      { name: "description", content: "Ficha técnica generada por el maestro IA." },
    ],
  }),
  component: Detalle,
});

function Detalle() {
  const { tema } = useParams({ from: "/detalle/$tema" });
  const consulta = decodeURIComponent(tema);

  const localConsejo = useRouterState({
    select: (s) => (s.location.state as { consejo?: Consejo } | undefined)?.consejo,
  });

  const { data: aiData, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ["detalle", consulta],
    queryFn: () => consultarMaestro({ data: { consulta, idioma: "Español" } }),
    staleTime: 1000 * 60 * 30,
    enabled: !localConsejo,
  });

  const data = localConsejo
    ? {
        titulo: localConsejo.problema,
        diagnostico: localConsejo.problema,
        solucion: localConsejo.solucion,
        consejoMaestro: "",
        autor: localConsejo.autor,
        audioUrl: localConsejo.audioUrl,
      }
    : aiData
      ? { ...aiData, audioUrl: undefined as string | undefined }
      : null;

  const escuchar = (texto: string) => {
    if (data?.audioUrl) {
      const audio = new Audio(data.audioUrl);
      audio.play();
      return;
    }
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const u = new SpeechSynthesisUtterance(texto);
    u.lang = "es-ES";
    speechSynthesis.cancel();
    speechSynthesis.speak(u);
  };

  const textoCompleto = data
    ? `${data.diagnostico}. ${data.solucion}.${data.consejoMaestro ? ` Consejo del maestro: ${data.consejoMaestro}` : ""}`
    : "";

  const loading = !localConsejo && (isLoading || isFetching);

  return (
    <AppShell>
      <header className="px-5 pt-10 pb-4">
        <Link
          to="/biblioteca"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Biblioteca
        </Link>
        <div className="mt-3 flex items-center gap-2 text-primary">
          <Sparkles className="h-4 w-4" />
          <span className="text-xs font-semibold uppercase tracking-widest">Ficha del maestro</span>
        </div>
      </header>

      <section className="px-5">
        {loading ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            Consultando al maestro veterano…
            <span className="text-xs opacity-70">"{consulta}"</span>
          </div>
        ) : !localConsejo && isError ? (
          <div className="rounded-2xl border border-destructive/40 bg-destructive/5 p-5 text-sm">
            <p className="font-semibold text-destructive">No se pudo generar la ficha.</p>
            <p className="mt-1 text-muted-foreground">{(error as Error)?.message}</p>
            <button
              onClick={() => refetch()}
              className="mt-3 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground"
            >
              Reintentar
            </button>
          </div>
        ) : data ? (
          <article className="rounded-2xl border border-border bg-card p-5 shadow-card">
            <div className="text-xs font-semibold uppercase tracking-wider text-primary">
              {localConsejo ? "Consejo del taller" : "Generado por Senda-IA"}
            </div>
            <h1 className="mt-1 text-xl font-bold text-foreground">{data.titulo}</h1>
            {!localConsejo && (
              <p className="mt-3 text-[15px] leading-relaxed text-foreground">
                <span className="font-bold">Diagnóstico: </span>{data.diagnostico}
              </p>
            )}
            <p className="mt-2 text-[15px] leading-relaxed text-foreground">
              <span className="font-bold">Solución: </span>{data.solucion}
            </p>

            {data.consejoMaestro && (
              <div className="mt-5 rounded-xl border-l-4 border-primary bg-primary/5 p-3 text-sm italic text-foreground">
                "{data.consejoMaestro}"
              </div>
            )}

            <button
              onClick={() => escuchar(textoCompleto)}
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-soft transition hover:opacity-90"
            >
              <Volume2 className="h-4 w-4" />
              {data.audioUrl ? "Escuchar grabación del maestro" : "Escuchar explicación de viva voz"}
            </button>

            <div className="mt-4 flex items-start gap-2 rounded-xl bg-success/10 px-3 py-2.5 text-xs text-success">
              <ShieldCheck className="h-4 w-4 mt-0.5 shrink-0" />
              <div>
                <div className="font-bold uppercase tracking-wider">Legado Protegido</div>
                <div className="mt-0.5 font-medium">{data.autor}</div>
              </div>
            </div>
          </article>
        ) : null}
      </section>
    </AppShell>
  );
}
