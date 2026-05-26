import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Mic, BookOpen, ShieldCheck } from "lucide-react";
import sendaiaLogo from "@/assets/sendaia-logo.jpeg";


export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Senda-IaMalaga2026 — Protegiendo el legado de nuestros maestros" },
      {
        name: "description",
        content:
          "App de relevo generacional: captura del conocimiento táctico de mecánicos y operarios veteranos y consulta inmediata para aprendices.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <AppShell>
      <header className="px-5 pt-8 pb-4">
        <img
          src={sendaiaLogo}
          alt="SendaIA — El saber del veterano al alcance del aprendiz"
          className="mx-auto w-full max-w-[280px] h-auto"
        />
        <p className="mt-3 text-center text-sm text-muted-foreground">
          Conocimiento de taller que no se pierde.
        </p>
      </header>


      <section
        className="mx-5 overflow-hidden rounded-3xl p-6 text-primary-foreground shadow-card"
        style={{ background: "var(--gradient-hero)" }}
      >
        <ShieldCheck className="h-8 w-8 opacity-90" />
        <h2 className="mt-3 text-xl font-semibold">
          Protegiendo el legado de nuestros maestros
        </h2>
        <p className="mt-2 text-sm opacity-90">
          Una herramienta para que los veteranos compartan su saber y los aprendices lo
          tengan siempre a mano.
        </p>
      </section>

      <section className="mt-8 px-5">
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Funciones estrella
        </h3>
        <div className="grid grid-cols-1 gap-3">
          <Link
            to="/asistente"
            className="group flex items-center gap-4 rounded-2xl border border-border bg-card p-4 shadow-soft transition hover:border-primary/40 hover:shadow-card"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Mic className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <div className="font-semibold text-foreground">Asistente de Voz</div>
              <div className="text-sm text-muted-foreground">
                Pregunta en tu idioma, obtén la respuesta del maestro.
              </div>
            </div>
          </Link>

          <Link
            to="/biblioteca"
            className="group flex items-center gap-4 rounded-2xl border border-border bg-card p-4 shadow-soft transition hover:border-primary/40 hover:shadow-card"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success/15 text-success">
              <BookOpen className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <div className="font-semibold text-foreground">Biblioteca de Conocimiento</div>
              <div className="text-sm text-muted-foreground">
                Consulta trucos guardados por categoría.
              </div>
            </div>
          </Link>
        </div>
      </section>

      <section className="mt-8 px-5">
        <div className="rounded-2xl bg-secondary p-4 text-sm text-secondary-foreground">
          <strong className="font-semibold">¿Eres veterano?</strong> Graba tus trucos en el{" "}
          <Link to="/veterano" className="font-semibold text-primary underline">
            Panel del Veterano
          </Link>{" "}
          y deja huella.
        </div>
      </section>
    </AppShell>
  );
}
