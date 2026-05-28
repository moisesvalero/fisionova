import Link from "next/link";
import type { Metadata } from "next";

import { siteConfig } from "@/config/site";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "Política de cookies",
  description:
    "Información sobre las cookies técnicas, preferencias y consentimiento de FisioNova Clínica.",
  path: "/politica-cookies",
});

const cookieRows = [
  {
    name: "fisionova-cookie-consent",
    owner: "Propia",
    purpose:
      "Guardar la preferencia de consentimiento elegida en el banner de cookies.",
    duration: "Persistente en localStorage hasta que el usuario la modifique.",
    type: "Técnica",
  },
  {
    name: "Cookies técnicas de Next.js",
    owner: "Propia",
    purpose:
      "Permitir el funcionamiento básico de la aplicación, rutas y renderizado.",
    duration: "Sesión o duración técnica mínima.",
    type: "Necesaria",
  },
];

export default function CookiePolicyPage() {
  return (
    <main className="bg-background text-foreground min-h-screen px-6 py-10 lg:px-12">
      <div className="mx-auto max-w-4xl">
        <Link
          href="/"
          className="text-muted-foreground hover:text-foreground text-sm transition-colors"
        >
          Volver a la web
        </Link>

        <header className="border-border mt-12 border-b pb-10">
          <span className="text-sage text-xs tracking-[0.18em] uppercase">
            Legal
          </span>
          <h1 className="font-display mt-3 text-4xl leading-tight lg:text-6xl">
            Política de cookies
          </h1>
          <p className="text-muted-foreground mt-5 text-lg leading-relaxed">
            Esta página explica cómo usa cookies y tecnologías similares{" "}
            {siteConfig.name}. Es una demo de portfolio, por lo que no se
            activan herramientas reales de analítica o publicidad.
          </p>
        </header>

        <section className="space-y-8 py-10">
          <article>
            <h2 className="font-display text-2xl">Qué son las cookies</h2>
            <p className="text-muted-foreground mt-3 leading-relaxed">
              Las cookies son pequeños archivos o identificadores que una web
              puede guardar en el navegador para recordar información técnica,
              preferencias o datos de uso.
            </p>
          </article>

          <article>
            <h2 className="font-display text-2xl">Qué cookies usamos</h2>
            <p className="text-muted-foreground mt-3 leading-relaxed">
              Actualmente solo usamos almacenamiento técnico para recordar tu
              elección en el banner. Las categorías analíticas y de marketing
              aparecen en el panel de preferencias para mostrar cómo se
              gestionaría el consentimiento en un proyecto real.
            </p>

            <div className="border-border mt-6 overflow-x-auto rounded-xl border">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="bg-secondary/60">
                  <tr>
                    <th className="px-4 py-3 font-medium">Nombre</th>
                    <th className="px-4 py-3 font-medium">Titular</th>
                    <th className="px-4 py-3 font-medium">Finalidad</th>
                    <th className="px-4 py-3 font-medium">Duración</th>
                    <th className="px-4 py-3 font-medium">Tipo</th>
                  </tr>
                </thead>
                <tbody className="divide-border divide-y">
                  {cookieRows.map((row) => (
                    <tr key={row.name}>
                      <td className="px-4 py-3 font-medium">{row.name}</td>
                      <td className="px-4 py-3">{row.owner}</td>
                      <td className="text-muted-foreground px-4 py-3">
                        {row.purpose}
                      </td>
                      <td className="text-muted-foreground px-4 py-3">
                        {row.duration}
                      </td>
                      <td className="px-4 py-3">{row.type}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>

          <article>
            <h2 className="font-display text-2xl">
              Cómo aceptar, rechazar o configurar
            </h2>
            <p className="text-muted-foreground mt-3 leading-relaxed">
              El banner permite aceptar todas las categorías opcionales,
              rechazarlas o configurar preferencias de forma granular. Puedes
              volver a abrir el panel desde el enlace “Configurar cookies” del
              pie de página.
            </p>
          </article>

          <article>
            <h2 className="font-display text-2xl">Actualización</h2>
            <p className="text-muted-foreground mt-3 leading-relaxed">
              Si en el futuro se añaden herramientas como analítica, mapas,
              píxeles publicitarios o contenidos embebidos de terceros, esta
              política debe actualizarse antes de activarlos.
            </p>
          </article>
        </section>
      </div>
    </main>
  );
}
