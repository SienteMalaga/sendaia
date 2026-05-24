import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Mic, Volume2, Sparkles, ShieldCheck } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export const Route = createFileRoute("/asistente")({
  head: () => ({
    meta: [
      { title: "Asistente de Voz — Senda-IA" },
      { name: "description", content: "Asistente de diagnóstico por voz multilingüe." },
    ],
  }),
  component: Asistente,
});

type IdiomaCode = "es" | "en" | "fr" | "de" | "ar";

const idiomas: { code: IdiomaCode; label: string; bcp47: string }[] = [
  { code: "es", label: "Español", bcp47: "es-ES" },
  { code: "en", label: "English", bcp47: "en-US" },
  { code: "fr", label: "Français", bcp47: "fr-FR" },
  { code: "de", label: "Deutsch", bcp47: "de-DE" },
  { code: "ar", label: "العربية", bcp47: "ar-SA" },
];

type Traduccion = {
  consulta: string;
  problema: string;
  solucion: string;
  autor: string;
  categoria: string;
  badge: string;
  validado: string;
  escuchar: string;
  escuchando: string;
  pulsar: string;
  subtitulo: string;
  titulo: string;
  idiomaLabel: string;
  tuConsulta: string;
};

const traducciones: Record<IdiomaCode, Traduccion> = {
  es: {
    titulo: "Diagnóstico por voz",
    subtitulo: "Pulsa, habla en tu idioma y escucha al maestro.",
    idiomaLabel: "Idioma",
    pulsar: "Pulsar para Hablar",
    escuchando: "Escuchando tu duda...",
    tuConsulta: "Texto detectado por voz",
    consulta: "El tornillo del cárter está totalmente atascado y no sale",
    categoria: "Mecánica de Coches",
    problema: "Tornillo del cárter atascado",
    solucion:
      "No lo fuerces de golpe. Dale un golpe seco con el martillo de teflón en el sentido de las agujas del reloj para asentar la rosca, y luego afloja hacia la izquierda poco a poco.",
    autor: "Paco Román (Maestro Mecánico, Málaga)",
    badge: "Legado Protegido",
    validado: "Consejo validado por el maestro",
    escuchar: "Escuchar explicación de viva voz",
  },
  en: {
    titulo: "Voice diagnosis",
    subtitulo: "Press, speak in your language and listen to the master.",
    idiomaLabel: "Language",
    pulsar: "Press to Speak",
    escuchando: "Listening to your question...",
    tuConsulta: "Voice-detected text",
    consulta: "The oil pan bolt is completely stuck and won't come out",
    categoria: "Car Mechanics",
    problema: "Stuck oil pan bolt",
    solucion:
      "Don't force it all at once. Give it a sharp tap with the teflon hammer clockwise to seat the thread, then loosen it slowly to the left.",
    autor: "Paco Román (Master Mechanic, Málaga)",
    badge: "Legacy Protected",
    validado: "Advice validated by the master",
    escuchar: "Listen to the explanation aloud",
  },
  fr: {
    titulo: "Diagnostic vocal",
    subtitulo: "Appuyez, parlez dans votre langue et écoutez le maître.",
    idiomaLabel: "Langue",
    pulsar: "Appuyer pour Parler",
    escuchando: "Écoute de votre question...",
    tuConsulta: "Texte détecté par la voix",
    consulta: "Le boulon du carter est complètement coincé et ne sort pas",
    categoria: "Mécanique Auto",
    problema: "Boulon du carter coincé",
    solucion:
      "Ne le forcez pas d'un coup. Donnez un coup sec avec le marteau en téflon dans le sens des aiguilles d'une montre pour replacer le filetage, puis desserrez lentement vers la gauche.",
    autor: "Paco Román (Maître Mécanicien, Málaga)",
    badge: "Héritage Protégé",
    validado: "Conseil validé par le maître",
    escuchar: "Écouter l'explication à voix haute",
  },
  de: {
    titulo: "Sprachdiagnose",
    subtitulo: "Drücken, in deiner Sprache sprechen und dem Meister zuhören.",
    idiomaLabel: "Sprache",
    pulsar: "Drücken zum Sprechen",
    escuchando: "Höre deine Frage...",
    tuConsulta: "Per Sprache erkannter Text",
    consulta: "Die Ölwannenschraube ist komplett festgefressen und geht nicht raus",
    categoria: "KFZ-Mechanik",
    problema: "Festsitzende Ölwannenschraube",
    solucion:
      "Nicht mit Gewalt lösen. Gib ihr einen kurzen Schlag mit dem Teflonhammer im Uhrzeigersinn, um das Gewinde zu setzen, und löse sie dann langsam nach links.",
    autor: "Paco Román (Meistermechaniker, Málaga)",
    badge: "Erbe Geschützt",
    validado: "Vom Meister bestätigter Rat",
    escuchar: "Erklärung laut anhören",
  },
  ar: {
    titulo: "تشخيص صوتي",
    subtitulo: "اضغط، تحدث بلغتك واستمع إلى المعلم.",
    idiomaLabel: "اللغة",
    pulsar: "اضغط للتحدث",
    escuchando: "جارٍ الاستماع إلى سؤالك...",
    tuConsulta: "النص المكتشف صوتيًا",
    consulta: "مسمار حوض الزيت عالق تمامًا ولا يخرج",
    categoria: "ميكانيكا السيارات",
    problema: "مسمار حوض الزيت عالق",
    solucion:
      "لا تستخدم القوة دفعة واحدة. اطرقه طرقة حادة بمطرقة التفلون باتجاه عقارب الساعة لتثبيت السن، ثم فكّه ببطء نحو اليسار.",
    autor: "باكو رومان (معلم ميكانيكي، مالقة)",
    badge: "الإرث محمي",
    validado: "نصيحة مصدّقة من المعلم",
    escuchar: "استمع إلى الشرح بصوت عالٍ",
  },
};

function Asistente() {
  const [idioma, setIdioma] = useState<IdiomaCode>("es");
  const [escuchando, setEscuchando] = useState(false);
  const [mostrarRespuesta, setMostrarRespuesta] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const t = traducciones[idioma];
  const bcp47 = idiomas.find((i) => i.code === idioma)?.bcp47 ?? "es-ES";

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleHablar = () => {
    if (escuchando) return;
    setMostrarRespuesta(false);
    setEscuchando(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setEscuchando(false);
      setMostrarRespuesta(true);
    }, 3000);
  };

  const escucharConsejo = (texto: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const u = new SpeechSynthesisUtterance(texto);
    u.lang = bcp47;
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

      <section className="mt-10 flex flex-col items-center px-5">
        <button
          onClick={handleHablar}
          disabled={escuchando}
          className={`relative flex h-44 w-44 items-center justify-center rounded-full text-primary-foreground shadow-card transition active:scale-95 ${
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
          <Mic className="h-16 w-16" />
        </button>

        {escuchando ? (
          <div className="mt-6 flex flex-col items-center gap-3">
            <p className="text-center text-sm font-semibold text-red-600 animate-pulse">
              {t.escuchando}
            </p>
            <div className="flex items-end gap-1 h-8">
              {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                <span
                  key={i}
                  className="w-1.5 rounded-full bg-red-500"
                  style={{
                    animation: `wave 0.9s ease-in-out ${i * 0.1}s infinite`,
                    height: "100%",
                  }}
                />
              ))}
            </div>
          </div>
        ) : (
          <p className="mt-4 text-center text-sm font-medium text-muted-foreground">
            {t.pulsar}
          </p>
        )}
      </section>

      {mostrarRespuesta && !escuchando && (
        <section className="mt-8 px-5 animate-fade-in" dir={idioma === "ar" ? "rtl" : "ltr"}>
          <div className="mb-3 rounded-2xl bg-secondary p-3 text-sm text-secondary-foreground">
            <span className="font-semibold">{t.tuConsulta}: </span>
            "{t.consulta}"
          </div>
          <article className="rounded-2xl border border-border bg-card p-5 shadow-card">
            <div className="text-xs font-semibold uppercase tracking-wider text-primary">
              {t.categoria}
            </div>
            <h3 className="mt-1 text-lg font-bold text-foreground">{t.problema}</h3>
            <p className="mt-2 text-[15px] leading-relaxed text-foreground">{t.solucion}</p>

            <button
              onClick={() => escucharConsejo(t.solucion)}
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-soft transition hover:opacity-90"
            >
              <Volume2 className="h-4 w-4" />
              {t.escuchar}
            </button>

            <div className="mt-4 flex items-start gap-2 rounded-xl bg-success/10 px-3 py-2.5 text-xs text-success">
              <ShieldCheck className="h-4 w-4 mt-0.5 shrink-0" />
              <div>
                <div className="font-bold uppercase tracking-wider">{t.badge}</div>
                <div className="mt-0.5 font-medium">
                  {t.validado}: {t.autor}
                </div>
              </div>
            </div>
          </article>
        </section>
      )}

      <style>{`
        @keyframes wave {
          0%, 100% { transform: scaleY(0.3); }
          50% { transform: scaleY(1); }
        }
      `}</style>
    </AppShell>
  );
}
