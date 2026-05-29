import { z } from "zod";

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

const envSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.url().default(defaultAppUrl),
  NEXT_PUBLIC_SUPABASE_URL: z.url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  NEXT_PUBLIC_SANITY_PROJECT_ID: z.string().min(1).optional(),
  NEXT_PUBLIC_SANITY_DATASET: z.string().min(1).optional(),
  SANITY_API_READ_TOKEN: z.string().min(1).optional(),
  OPENAI_API_KEY: z.string().min(1).optional(),
  OPENAI_MODEL: z.string().min(1).default("gpt-5.4-nano"),
  RESEND_API_KEY: z.string().min(1).optional(),
  RESEND_FROM_EMAIL: z.email().optional(),
  DOCTOR_DASHBOARD_PIN: z.string().min(4).default("1234"),
});

export const env = envSchema.parse({
  NEXT_PUBLIC_APP_URL: resolveAppUrl(process.env.NEXT_PUBLIC_APP_URL),
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  NEXT_PUBLIC_SANITY_PROJECT_ID: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  NEXT_PUBLIC_SANITY_DATASET: process.env.NEXT_PUBLIC_SANITY_DATASET,
  SANITY_API_READ_TOKEN: process.env.SANITY_API_READ_TOKEN,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  OPENAI_MODEL: process.env.OPENAI_MODEL,
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL,
  DOCTOR_DASHBOARD_PIN: process.env.DOCTOR_DASHBOARD_PIN,
});
