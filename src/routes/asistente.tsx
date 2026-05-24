import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Mic, Volume2, Sparkles, ShieldCheck, Send, Loader2, ChevronRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { consultarMaestro } from "@/lib/ai.functions";

export const Route = createFileRoute("/asistente")({
  head: () => ({
    meta: [
      { title: "Asistente de Voz — Senda-IA" },
      { name: "description", content: "Asistente de diagnóstico por voz e IA multilingüe." },
    ],
  }),
  component: Asistente,
});

type IdiomaCode = "es" | "en" | "fr" | "de" | "ar";

const idiomas: { code: IdiomaCode; label: string; bcp47: string; nombre: string }[] = [
  { code: "es", label: "Español", bcp47: "es-ES", nombre: "Español" },
  { code: "en", label: "English", bcp47: "en-US", nombre: "English" },
  { code: "fr", label: "Français", bcp47: "fr-FR", nombre: "Français" },
  { code: "de", label: "Deutsch", bcp47: "de-DE", nombre: "Deutsch" },
  { code: "ar", label: "العربية", bcp47: "ar-SA", nombre: "العربية" },
];

const ui: Record<IdiomaCode, Record<string, string>> = {
  es: {
    titulo: "Diagnóstico por voz", subtitulo: "Pulsa, habla o escribe. La IA del maestro te responde.",
    idiomaLabel: "Idioma", pulsar: "Pulsar para Hablar", escuchando: "Escuchando al operario... Di tu duda en voz alta",
    placeholder: "Ej. El motor saca humo blanco / La fresadora no arranca",
    enviar: "Consultar al maestro", consultando: "Consultando al maestro veterano…",
    tuConsulta: "Tu consulta", diagnostico: "Diagnóstico", pasos: "Pasos",
    consejoMaestro: "Truco del maestro", relacionados: "Más averías similares",
    escuchar: "Escuchar explicación de viva voz", validado: "Consejo validado por el maestro",
    badge: "Legado Protegido", error: "No pude conectar con el maestro.",
    simLabel: "Simular lo que dice el usuario", simPlaceholder: "Ej. humo blanco en el motor",
    demoConsulta: "El tornillo del cárter del aceite está atascado y no sale",
  },
  en: {
    titulo: "Voice diagnosis", subtitulo: "Press, speak or type. The master's AI replies.",
    idiomaLabel: "Language", pulsar: "Press to Speak", escuchando: "Listening to the operator... Speak your question",
    placeholder: "E.g. The engine blows white smoke / The milling machine won't start",
    enviar: "Ask the master", consultando: "Asking the veteran master…",
    tuConsulta: "Your question", diagnostico: "Diagnosis", pasos: "Steps",
    consejoMaestro: "Master's tip", relacionados: "Related issues",
    escuchar: "Listen aloud", validado: "Validated by the master",
    badge: "Legacy Protected", error: "Could not reach the master.",
    simLabel: "Simulate what the user says", simPlaceholder: "E.g. white smoke in the engine",
    demoConsulta: "The oil pan bolt is completely stuck and won't come out",
  },
  fr: {
    titulo: "Diagnostic vocal", subtitulo: "Appuyez, parlez ou écrivez. L'IA du maître répond.",
    idiomaLabel: "Langue", pulsar: "Appuyer pour Parler", escuchando: "Écoute de l'opérateur... Posez votre question",
    placeholder: "Ex. Le moteur dégage de la fumée blanche",
    enviar: "Demander au maître", consultando: "Consultation du maître vétéran…",
    tuConsulta: "Votre question", diagnostico: "Diagnostic", pasos: "Étapes",
    consejoMaestro: "Astuce du maître", relacionados: "Pannes similaires",
    escuchar: "Écouter à voix haute", validado: "Validé par le maître",
    badge: "Héritage Protégé", error: "Impossible de joindre le maître.",
    simLabel: "Simuler ce que dit l'utilisateur", simPlaceholder: "Ex. fumée blanche dans le moteur",
    demoConsulta: "Le boulon du carter d'huile est bloqué et ne sort pas",
  },
  de: {
    titulo: "Sprachdiagnose", subtitulo: "Drücken, sprechen oder schreiben. Die KI antwortet.",
    idiomaLabel: "Sprache", pulsar: "Drücken zum Sprechen", escuchando: "Höre dem Mechaniker zu... Sprich deine Frage",
    placeholder: "Z. B. Motor qualmt weiß / Fräsmaschine startet nicht",
    enviar: "Meister fragen", consultando: "Frage den Meister…",
    tuConsulta: "Deine Frage", diagnostico: "Diagnose", pasos: "Schritte",
    consejoMaestro: "Meister-Tipp", relacionados: "Ähnliche Pannen",
    escuchar: "Vorlesen", validado: "Vom Meister bestätigt",
    badge: "Erbe Geschützt", error: "Meister nicht erreichbar.",
    simLabel: "Simuliere, was der Benutzer sagt", simPlaceholder: "Z. B. weißer Rauch im Motor",
    demoConsulta: "Die Ölwannenschraube sitzt fest und geht nicht heraus",
  },
  ar: {
    titulo: "تشخيص صوتي", subtitulo: "اضغط أو اكتب وسيرد عليك المعلم.",
    idiomaLabel: "اللغة", pulsar: "اضغط للتحدث", escuchando: "جارٍ الاستماع إلى الفني... تحدث بسؤالك",
    placeholder: "مثال: المحرك يخرج دخانًا أبيض",
    enviar: "اسأل المعلم", consultando: "جارٍ سؤال المعلم…",
    tuConsulta: "سؤالك", diagnostico: "التشخيص", pasos: "الخطوات",
    consejoMaestro: "نصيحة المعلم", relacionados: "أعطال مشابهة",
    escuchar: "استمع بصوت عالٍ", validado: "مصادق عليه من المعلم",
    badge: "الإرث محمي", error: "تعذّر الوصول إلى المعلم.",
    simLabel: "محاكاة ما يقوله المستخدم", simPlaceholder: "مثال: دخان أبيض في المحرك",
    demoConsulta: "برغي حوض الزيت عالق ولا يخرج",
  },
};

type Respuesta = Awaited<ReturnType<typeof consultarMaestro>>;

function Asistente() {
  const [idioma, setIdioma] = useState<IdiomaCode>("es");
  const [escuchando, setEscuchando] = useState(false);
  const [texto, setTexto] = useState("");
  const [simulacion, setSimulacion] = useState("");
  const [consultando, setConsultando] = useState(false);
  const [respuesta, setRespuesta] = useState<Respuesta | null>(null);
  const [errMsg, setErrMsg] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const t = ui[idioma];
  const meta = idiomas.find((i) => i.code === idioma)!;

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  const lanzarConsulta = async (consulta: string) => {
    setConsultando(true);
    setErrMsg(null);
    setRespuesta(null);
    try {
      const r = await consultarMaestro({ data: { consulta, idioma: meta.nombre } });
      setRespuesta(r);
    } catch (e) {
      setErrMsg((e as Error)?.message ?? t.error);
    } finally {
      setConsultando(false);
    }
  };

  const handleHablar = () => {
    if (escuchando || consultando) return;
    setRespuesta(null);
    setErrMsg(null);
    setEscuchando(true);
    timerRef.current = setTimeout(() => {
      setEscuchando(false);
      const consulta = simulacion.trim() || t.demoConsulta;
      setTexto(consulta);
      lanzarConsulta(consulta);
    }, 4000);
  };

  const enviar = async () => {
    const consulta = texto.trim();
    if (!consulta || consultando) return;
    await lanzarConsulta(consulta);
  };

  const escuchar = (str: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const u = new SpeechSynthesisUtterance(str);
    u.lang = meta.bcp47;
    speechSynthesis.cancel();
    speechSynthesis.speak(u);
  };

  const audioTexto = respuesta
    ? `${respuesta.diagnostico}. ${respuesta.pasos.join(". ")}. ${respuesta.consejoMaestro}`
    : "";

  return (
    <AppShell>
      <header className="px-5 pt-10 pb-4">
        <div className="flex items-center gap-2 text-primary">
          <Sparkles className="h-4 w-4" />
          <span className="text-xs font-semibold uppercase tracking-widest">Asistente IA</span>
        </div>
        <h1 className="mt-1 text-2xl font-bold">{t.titulo}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t.subtitulo}</p>
      </header>

      <section className="px-5">
        <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t.idiomaLabel}
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

      <section className="mt-8 flex flex-col items-center px-5">
        <button
          onClick={handleHablar}
          disabled={escuchando || consultando}
          className={`relative flex h-36 w-36 items-center justify-center rounded-full text-primary-foreground shadow-card transition active:scale-95 disabled:opacity-90 ${
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

        {escuchando ? (
          <div className="mt-5 flex flex-col items-center gap-3">
            <p className="text-center text-sm font-semibold text-red-600 animate-pulse">
              {t.escuchando}
            </p>
            <div className="flex h-7 items-end gap-1">
              {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                <span
                  key={i}
                  className="w-1.5 rounded-full bg-red-500"
                  style={{ animation: `wave 0.9s ease-in-out ${i * 0.1}s infinite`, height: "100%" }}
                />
              ))}
            </div>
          </div>
        ) : (
          <p className="mt-4 text-center text-sm font-medium text-muted-foreground">{t.pulsar}</p>
        )}
        <div className="mt-6 w-full max-w-sm" dir={idioma === "ar" ? "rtl" : "ltr"}>
          <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            {t.simLabel}
          </label>
          <input
            value={simulacion}
            onChange={(e) => setSimulacion(e.target.value)}
            placeholder={t.simPlaceholder}
            disabled={escuchando || consultando}
            className="w-full rounded-xl border border-dashed border-border bg-card/60 px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:border-primary"
          />
        </div>
      </section>

      <section className="mt-6 px-5" dir={idioma === "ar" ? "rtl" : "ltr"}>
        <div className="flex gap-2 rounded-full border border-border bg-card p-1.5 shadow-soft focus-within:border-primary">
          <input
            ref={inputRef}
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") enviar(); }}
            placeholder={t.placeholder}
            disabled={consultando}
            className="flex-1 bg-transparent px-3 py-2 text-sm outline-none placeholder:text-muted-foreground"
          />
          <button
            onClick={enviar}
            disabled={consultando || !texto.trim()}
            className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-soft transition hover:opacity-90 disabled:opacity-50"
          >
            {consultando ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
            {t.enviar}
          </button>
        </div>
      </section>

      {consultando && (
        <div className="mt-6 flex items-center justify-center gap-2 px-5 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin text-primary" /> {t.consultando}
        </div>
      )}

      {errMsg && !consultando && (
        <div className="mt-6 mx-5 rounded-2xl border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
          {t.error} {errMsg}
        </div>
      )}

      {respuesta && !consultando && (
        <section className="mt-6 px-5 animate-fade-in" dir={idioma === "ar" ? "rtl" : "ltr"}>
          <div className="mb-3 rounded-2xl bg-secondary p-3 text-sm text-secondary-foreground">
            <span className="font-semibold">{t.tuConsulta}: </span>"{texto}"
          </div>
          <article className="rounded-2xl border border-border bg-card p-5 shadow-card">
            <div className="text-xs font-semibold uppercase tracking-wider text-primary">
              {respuesta.categoria}
            </div>
            <h3 className="mt-1 text-lg font-bold text-foreground">{respuesta.titulo}</h3>

            <h4 className="mt-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {t.diagnostico}
            </h4>
            <p className="mt-1 text-[15px] leading-relaxed text-foreground">{respuesta.diagnostico}</p>

            <h4 className="mt-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {t.pasos}
            </h4>
            <ol className="mt-2 space-y-2">
              {respuesta.pasos.map((p, i) => (
                <li key={i} className="flex gap-3 rounded-xl bg-secondary/60 p-3 text-sm">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                    {i + 1}
                  </span>
                  <span className="leading-relaxed text-foreground">{p}</span>
                </li>
              ))}
            </ol>

            <div className="mt-4 rounded-xl border-l-4 border-primary bg-primary/5 p-3 text-sm italic text-foreground">
              <span className="not-italic font-semibold">{t.consejoMaestro}: </span>"{respuesta.consejoMaestro}"
            </div>

            <button
              onClick={() => escuchar(audioTexto)}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-soft transition hover:opacity-90"
            >
              <Volume2 className="h-4 w-4" />
              {t.escuchar}
            </button>

            <div className="mt-4 flex items-start gap-2 rounded-xl bg-success/10 px-3 py-2.5 text-xs text-success">
              <ShieldCheck className="h-4 w-4 mt-0.5 shrink-0" />
              <div>
                <div className="font-bold uppercase tracking-wider">{t.badge}</div>
                <div className="mt-0.5 font-medium">{t.validado}: {respuesta.autor}</div>
              </div>
            </div>
          </article>

          {respuesta.relacionados.length > 0 && (
            <section className="mt-6">
              <h4 className="text-sm font-bold uppercase tracking-wider text-foreground">
                {t.relacionados}
              </h4>
              <div className="mt-2 space-y-2">
                {respuesta.relacionados.map((r) => (
                  <Link
                    key={r}
                    to="/detalle/$tema"
                    params={{ tema: encodeURIComponent(r) }}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card p-3 text-sm shadow-soft transition hover:border-primary hover:bg-primary/5"
                  >
                    <span className="font-medium text-foreground">{r}</span>
                    <ChevronRight className="h-4 w-4 shrink-0 text-primary" />
                  </Link>
                ))}
              </div>
            </section>
          )}
        </section>
      )}

      <style>{`
        @keyframes wave { 0%,100% { transform: scaleY(0.3); } 50% { transform: scaleY(1); } }
      `}</style>
    </AppShell>
  );
}
