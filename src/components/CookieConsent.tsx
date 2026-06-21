import { useEffect, useState } from "react";
import { X, Cookie } from "lucide-react";

const STORAGE_KEY = "shtofollow_cookie_consent";

type Prefs = {
  necessary: true;
  performance: boolean;
  functional: boolean;
  advertising: boolean;
};

const defaultPrefs: Prefs = {
  necessary: true,
  performance: false,
  functional: false,
  advertising: false,
};

export function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [showPrefs, setShowPrefs] = useState(false);
  const [prefs, setPrefs] = useState<Prefs>(defaultPrefs);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) setVisible(true);
    } catch {
      setVisible(true);
    }
  }, []);

  const save = (value: Prefs) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...value, ts: Date.now() }));
    } catch {
      /* ignore */
    }
    setVisible(false);
    setShowPrefs(false);
  };

  const acceptAll = () =>
    save({ necessary: true, performance: true, functional: true, advertising: true });
  const rejectAll = () => save(defaultPrefs);
  const savePrefs = () => save(prefs);

  if (!visible) {
    return (
      <button
        onClick={() => {
          setShowPrefs(true);
          setVisible(true);
        }}
        aria-label="Cilësimet e Cookies"
        className="fixed bottom-4 left-4 z-[90] flex h-11 w-11 items-center justify-center rounded-full bg-card text-foreground shadow-lg ring-1 ring-border transition-colors hover:bg-muted"
      >
        <Cookie className="h-5 w-5 text-primary" />
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        aria-hidden
      />
      <div
        className="relative z-10 m-3 w-full max-w-lg rounded-2xl bg-card p-6 shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-label="Përdorimi i Cookies"
      >
        <div className="flex items-start justify-between gap-4">
          <h2 className="text-xl font-bold text-foreground">Përdorimi i Cookies</h2>
          <button
            onClick={rejectAll}
            aria-label="Mbyll"
            className="rounded-full p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {!showPrefs ? (
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Kjo uebfaqe përdor cookies për të përmirësuar përvojën tuaj. Ju keni
            kontroll të plotë mbi përdorimin e cookies dhe mund të zgjidhni në çdo
            moment nëse dëshironi t'i pranoni apo t'i refuzoni ato. Për më shumë
            informacione rreth cookies që përdorim, hapni cilësimet.
          </p>
        ) : (
          <div className="mt-3 space-y-3">
            <p className="text-sm text-muted-foreground">
              Ne dëshirojmë që leja juaj të përdoret të dhënat tuaja për qëllimet e
              mëposhtme:
            </p>
            <PrefRow
              title="Të nevojshme"
              desc="Këto cookie kërkohen për funksionalitet të mirë të faqes sonë të internetit dhe nuk mund të çaktivizohen në sistemin tonë."
              checked
              disabled
            />
            <PrefRow
              title="Performancë"
              desc="Ne i përdorim këto cookie për të siguruar informacion statistikor në lidhje me uebfaqen tonë - ato përdoren për matjen dhe përmirësimin e performancës."
              checked={prefs.performance}
              onChange={(v) => setPrefs((p) => ({ ...p, performance: v }))}
            />
            <PrefRow
              title="Funksionale"
              desc="Ne i përdorim këto cookie për të përmirësuar funksionalitetin dhe për të lejuar personalizimin."
              checked={prefs.functional}
              onChange={(v) => setPrefs((p) => ({ ...p, functional: v }))}
            />
            <PrefRow
              title="Reklamat"
              desc="Këto cookie vendosen përmes faqes sonë nga partnerët tanë të reklamimit."
              checked={prefs.advertising}
              onChange={(v) => setPrefs((p) => ({ ...p, advertising: v }))}
            />
          </div>
        )}

        <div className="mt-5 space-y-2">
          <button
            onClick={acceptAll}
            className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Pranoni të gjitha
          </button>
          <div className="grid grid-cols-2 gap-2">
            {showPrefs ? (
              <button
                onClick={savePrefs}
                className="rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Ruani cilësimet
              </button>
            ) : (
              <button
                onClick={() => setShowPrefs(true)}
                className="rounded-xl border border-primary px-4 py-3 text-sm font-semibold text-primary transition-colors hover:bg-primary/10"
              >
                Preferencat
              </button>
            )}
            <button
              onClick={rejectAll}
              className="rounded-xl border border-primary px-4 py-3 text-sm font-semibold text-primary transition-colors hover:bg-primary/10"
            >
              Refuzo
            </button>
          </div>
        </div>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          shtofollow.com — krijuar nga REA Marketing SH.P.K
        </p>
      </div>
    </div>
  );
}

function PrefRow({
  title,
  desc,
  checked,
  disabled,
  onChange,
}: {
  title: string;
  desc: string;
  checked: boolean;
  disabled?: boolean;
  onChange?: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-lg border border-border p-3">
      <div>
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{desc}</p>
      </div>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange?.(e.target.checked)}
        className="mt-1 h-5 w-5 shrink-0 accent-primary disabled:opacity-60"
        aria-label={title}
      />
    </div>
  );
}
