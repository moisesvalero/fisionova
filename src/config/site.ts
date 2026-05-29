const defaultAppUrl =
  process.env.NODE_ENV === "production"
    ? "https://proyecto-ia-recepcionista.vercel.app"
    : "http://localhost:3000";

function resolveAppUrl(value: string | undefined) {
  if (
    process.env.NODE_ENV === "production" &&
    value?.startsWith("http://localhost")
  ) {
    return defaultAppUrl;
  }

  return value ?? defaultAppUrl;
}

export const siteConfig = {
  name: "FisioNova Clínica",
  shortName: "FisioNova",
  description:
    "Clínica de fisioterapia con reserva online, agenda privada y confirmaciones por email.",
  url: resolveAppUrl(process.env.NEXT_PUBLIC_APP_URL),
  locale: "es_ES",
  creator: "moisesvalero",
  keywords: [
    "recepcionista IA",
    "fisioterapia",
    "agenda online",
    "OpenAI",
    "Resend",
    "Next.js",
    "React",
    "TypeScript",
  ],
};
