"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Button } from "@/components/ui/button";

type CookieConsent = {
  necessary: true;
  analytics: boolean;
  marketing: boolean;
  savedAt: string;
  version: 1;
};

const consentKey = "fisionova-cookie-consent";

function buildConsent(
  preferences: Pick<CookieConsent, "analytics" | "marketing">,
): CookieConsent {
  return {
    necessary: true,
    analytics: preferences.analytics,
    marketing: preferences.marketing,
    savedAt: new Date().toISOString(),
    version: 1,
  };
}

function saveConsent(consent: CookieConsent) {
  window.localStorage.setItem(consentKey, JSON.stringify(consent));
  window.dispatchEvent(
    new CustomEvent("fisionova-cookie-consent", { detail: consent }),
  );
}

export function CookieBanner() {
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const stored = window.localStorage.getItem(consentKey);

      if (!stored) {
        setIsVisible(true);
        return;
      }

      try {
        const parsed = JSON.parse(stored) as CookieConsent;
        setAnalytics(Boolean(parsed.analytics));
        setMarketing(Boolean(parsed.marketing));
      } catch {
        setIsVisible(true);
      }
    }, 0);

    return () => window.clearTimeout(timeout);
  }, []);

  useEffect(() => {
    function openPreferences() {
      setShowSettings(true);
      setIsVisible(true);
    }

    window.addEventListener("fisionova-open-cookie-settings", openPreferences);

    return () => {
      window.removeEventListener(
        "fisionova-open-cookie-settings",
        openPreferences,
      );
    };
  }, []);

  function acceptAll() {
    saveConsent(buildConsent({ analytics: true, marketing: true }));
    setIsVisible(false);
  }

  function rejectAll() {
    setAnalytics(false);
    setMarketing(false);
    saveConsent(buildConsent({ analytics: false, marketing: false }));
    setIsVisible(false);
  }

  function saveSettings() {
    saveConsent(buildConsent({ analytics, marketing }));
    setIsVisible(false);
  }

  if (!isVisible || pathname?.startsWith("/medico")) {
    return null;
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-[70] px-4 pb-4 sm:px-6 sm:pb-6">
      <section
        className="shadow-elegant border-border bg-card mx-auto max-w-4xl rounded-xl border p-5"
        aria-label="Preferencias de cookies"
      >
        <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-start">
          <div>
            <p className="text-sage text-xs font-medium tracking-[0.16em] uppercase">
              Privacidad
            </p>
            <h2 className="font-display mt-2 text-2xl">
              Configuración de cookies
            </h2>
            <p className="text-muted-foreground mt-2 max-w-2xl text-sm leading-relaxed">
              Usamos cookies técnicas necesarias para que la web funcione. Las
              analíticas o de marketing solo se activarían si las aceptas.
              Puedes aceptar, rechazar o configurar tus preferencias.
            </p>
            <Link
              href="/politica-cookies"
              className="text-foreground mt-3 inline-flex text-sm font-medium underline underline-offset-4"
            >
              Leer política de cookies
            </Link>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row lg:flex-col">
            <Button type="button" onClick={acceptAll}>
              Aceptar
            </Button>
            <Button type="button" variant="outline" onClick={rejectAll}>
              Rechazar
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setShowSettings((current) => !current)}
            >
              Configurar
            </Button>
          </div>
        </div>

        {showSettings ? (
          <div className="border-border mt-5 grid gap-3 border-t pt-5">
            <label className="border-border bg-background/70 flex items-start justify-between gap-4 rounded-lg border p-4">
              <span>
                <span className="block text-sm font-medium">
                  Cookies necesarias
                </span>
                <span className="text-muted-foreground mt-1 block text-xs leading-relaxed">
                  Imprescindibles para recordar la sesión técnica y preferencias
                  básicas. Siempre activas.
                </span>
              </span>
              <input type="checkbox" checked disabled className="mt-1" />
            </label>

            <label className="border-border bg-background/70 flex items-start justify-between gap-4 rounded-lg border p-4">
              <span>
                <span className="block text-sm font-medium">
                  Cookies analíticas
                </span>
                <span className="text-muted-foreground mt-1 block text-xs leading-relaxed">
                  Ayudarían a entender visitas y uso de la web. En esta demo no
                  hay medición externa activa.
                </span>
              </span>
              <input
                type="checkbox"
                checked={analytics}
                onChange={(event) => setAnalytics(event.target.checked)}
                className="mt-1"
              />
            </label>

            <label className="border-border bg-background/70 flex items-start justify-between gap-4 rounded-lg border p-4">
              <span>
                <span className="block text-sm font-medium">
                  Cookies de marketing
                </span>
                <span className="text-muted-foreground mt-1 block text-xs leading-relaxed">
                  Servirían para campañas o seguimiento publicitario. En esta
                  demo están desactivadas salvo consentimiento.
                </span>
              </span>
              <input
                type="checkbox"
                checked={marketing}
                onChange={(event) => setMarketing(event.target.checked)}
                className="mt-1"
              />
            </label>

            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" onClick={rejectAll}>
                Rechazar todo
              </Button>
              <Button type="button" onClick={saveSettings}>
                Guardar configuración
              </Button>
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}
