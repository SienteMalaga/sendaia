import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Mic, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export const Route = createFileRoute("/asistente")({
  head: () => ({
    meta: [
      { title: "Asistente de Voz — Senda-IA" },
      { name: "description", content: "Asistente de diagnóstico por voz, 100% local." },
    ],
  }),
  component: Asistente,
});

type IdiomaCode = "es" | "en" | "fr" | "de" | "ar";
type TemaKey = "aceite" | "bateria" | "bujia";

const idiomas: { code: IdiomaCode; label: string; bcp47: string }[] = [
  { code: "es", label: "Español", bcp47: "es-ES" },
  { code: "en", label: "English", bcp47: "en-US" },
  { code: "fr", label: "Français", bcp47: "fr-FR" },
  { code: "de", label: "Deutsch", bcp47: "de-DE" },
  { code: "ar", label: "العربية", bcp47: "ar-SA" },
];

const ui: Record<IdiomaCode, Record<string, string>> = {
  es: {
    titulo: "Diagnóstico por voz", subtitulo: "Pulsa el micro o elige una palabra técnica. Respuesta al instante.",
    idiomaLabel: "Idioma", pulsar: "Pulsar para Hablar", escuchando: "Escuchando...",
    atajos: "Palabras clave de demo", transcriptLabel: "Transcript detectado por el micrófono",
    transcriptPlaceholder: "Escribe exactamente lo que quieres simular: cómo cambiar el aceite",
    tuConsulta: "Tu consulta", diagnostico: "Diagnóstico", solucion: "Solución",
    validado: "Consejo validado por el maestro", sinConsulta: "Consulta no guardada. Intente buscar palabras como Aceite, Batería o Bujía",
  },
  en: {
    titulo: "Voice diagnosis", subtitulo: "Tap the mic or pick a keyword. Instant answer.",
    idiomaLabel: "Language", pulsar: "Press to Speak", escuchando: "Listening...",
    atajos: "Demo keywords", transcriptLabel: "Microphone transcript",
    transcriptPlaceholder: "Type the exact phrase to simulate: how to change the oil",
    tuConsulta: "Your question", diagnostico: "Diagnosis", solucion: "Solution",
    validado: "Validated by the master", sinConsulta: "Consulta no guardada. Intente buscar palabras como Aceite, Batería o Bujía",
  },
  fr: {
    titulo: "Diagnostic vocal", subtitulo: "Appuyez ou choisissez un mot. Réponse immédiate.",
    idiomaLabel: "Langue", pulsar: "Appuyer pour Parler", escuchando: "Écoute...",
    atajos: "Mots-clés de démo", transcriptLabel: "Transcript du microphone",
    transcriptPlaceholder: "Saisissez la phrase exacte à simuler : comment changer l'huile",
    tuConsulta: "Votre question", diagnostico: "Diagnostic", solucion: "Solution",
    validado: "Validé par le maître", sinConsulta: "Consulta no guardada. Intente buscar palabras como Aceite, Batería o Bujía",
  },
  de: {
    titulo: "Sprachdiagnose", subtitulo: "Mikro drücken oder Stichwort wählen. Sofortantwort.",
    idiomaLabel: "Sprache", pulsar: "Drücken zum Sprechen", escuchando: "Höre zu...",
    atajos: "Demo-Schlüsselwörter", transcriptLabel: "Mikrofon-Transcript",
    transcriptPlaceholder: "Exakten Demo-Satz eingeben: Öl wechseln",
    tuConsulta: "Deine Frage", diagnostico: "Diagnose", solucion: "Lösung",
    validado: "Vom Meister bestätigt", sinConsulta: "Consulta no guardada. Intente buscar palabras como Aceite, Batería o Bujía",
  },
  ar: {
    titulo: "تشخيص صوتي", subtitulo: "اضغط أو اختر كلمة. الرد فوري.",
    idiomaLabel: "اللغة", pulsar: "اضغط للتحدث", escuchando: "جارٍ الاستماع...",
    atajos: "كلمات العرض", transcriptLabel: "نص الميكروفون",
    transcriptPlaceholder: "اكتب العبارة المراد محاكاتها: تغيير الزيت",
    tuConsulta: "سؤالك", diagnostico: "التشخيص", solucion: "الحل",
    validado: "مصادق عليه من المعلم", sinConsulta: "Consulta no guardada. Intente buscar palabras como Aceite, Batería o Bujía",
  },
};

type Respuesta = {
  diagnostico: string;
  solucion: string;
  autor: string;
};

const RESPUESTAS: Record<TemaKey, { label: string; data: Respuesta }> = {
  aceite: {
    label: "Aceite",
    data: {
      diagnostico: "Nivel bajo o necesidad de cambio de fluido.",
      solucion: "Vacía el cárter quitando el tapón inferior con el motor templado. Cambia el filtro de aceite y rellena con el SAE recomendado hasta la marca máxima de la varilla.",
      autor: "Carlos Ortiz (Experto en Diagnosis)",
    },
  },
  bateria: {
    label: "Batería",
    data: {
      diagnostico: "Bornes con sulfato o falta de tensión.",
      solucion: "Limpia los bornes con agua y bicarbonato si tienen costra blanca y aprieta las tuercas. Si sigue sin fuerza, usa pinzas de arranque.",
      autor: "Paco Román (Mecánica Málaga)",
    },
  },
  bujia: {
    label: "Bujía",
    data: {
      diagnostico: "Desgaste en los electrodos o carbonilla.",
      solucion: "Desconecta el cable de la bujía, usa una llave de bujías para extraerla y comprueba la distancia del electrodo. Sustitúyela si está negra o gastada.",
      autor: "María José Suárez (Especialista en Motores)",
    },
  },
};

function normalizar(texto: string) {
  return texto.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function detectarTema(transcript: string): TemaKey | null {
  const limpio = normalizar(transcript);
  if (limpio.includes("aceite")) return "aceite";
  if (limpio.includes("bateria")) return "bateria";
  if (limpio.includes("bujia")) return "bujia";
  return null;
}

function Asistente() {
  const [idioma, setIdioma] = useState<IdiomaCode>("es");
  const [escuchando, setEscuchando] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [tema, setTema] = useState<TemaKey | null>(null);
  const [respuesta, setRespuesta] = useState<Respuesta | null>(null);
  const [mensaje, setMensaje] = useState("");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const t = ui[idioma];

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  const seleccionar = (k: TemaKey) => {
    if (escuchando) return;
    setTranscript(RESPUESTAS[k].label);
    setTema(k);
    setRespuesta(RESPUESTAS[k].data);
    setMensaje("");
  };

  const handleHablar = () => {
    if (escuchando) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    setTema(null);
    setRespuesta(null);
    setMensaje("");
    setEscuchando(true);
    timerRef.current = setTimeout(() => {
      const textoReal = transcript.trim();
      const temaDetectado = detectarTema(textoReal);
      setEscuchando(false);
      setTema(temaDetectado);
      setRespuesta(temaDetectado ? RESPUESTAS[temaDetectado].data : null);
      setMensaje(temaDetectado ? "" : t.sinConsulta);
    }, 3000);
  };

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
          disabled={escuchando}
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
      </section>

      <section className="mt-8 px-5">
        <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted-foreground text-center">
          {t.atajos}
        </label>
        <div className="flex flex-wrap justify-center gap-2">
          {(Object.keys(RESPUESTAS) as TemaKey[]).map((k) => (
            <button
              key={k}
              onClick={() => seleccionar(k)}
              disabled={escuchando}
              className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                tema === k
                  ? "border-primary bg-primary text-primary-foreground shadow-soft"
                  : "border-border bg-card text-foreground hover:border-primary/60 hover:bg-primary/5"
              }`}
            >
              {RESPUESTAS[k].label}
            </button>
          ))}
        </div>
      </section>

      {respuesta && (
        <section className="mt-6 px-5 animate-fade-in" dir={idioma === "ar" ? "rtl" : "ltr"}>
          <div className="mb-3 rounded-2xl bg-secondary p-3 text-sm text-secondary-foreground">
            <span className="font-semibold">{t.tuConsulta}: </span>"{RESPUESTAS[tema!].label}"
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
              {t.solucion}
            </h4>
            <p className="mt-1 text-[15px] leading-relaxed text-foreground">{respuesta.solucion}</p>

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
