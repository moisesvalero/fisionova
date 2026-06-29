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
  OPENROUTER_API_KEY: z.string().min(1).optional(),
  OPENROUTER_MODEL: z.string().min(1).default("openrouter/free"),
  GEMINI_API_KEY: z.string().min(1).optional(),
  GEMINI_MODEL: z.string().min(1).default("gemini-2.5-flash"),
  RESEND_API_KEY: z.string().min(1).optional(),
  RESEND_FROM_EMAIL: z.string().email().optional(),
  RESEND_REPLY_TO_EMAIL: z.string().email().optional(),
  RESEND_TEST_RECIPIENT: z.string().email().optional(),
  DOCTOR_DASHBOARD_PIN: z.string().min(4).default("1234"),
  APPOINTMENT_ACTION_SECRET: z.string().min(1).optional(),
});

export const env = envSchema.parse({
  NEXT_PUBLIC_APP_URL: resolveAppUrl(process.env.NEXT_PUBLIC_APP_URL),
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  NEXT_PUBLIC_SANITY_PROJECT_ID: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  NEXT_PUBLIC_SANITY_DATASET: process.env.NEXT_PUBLIC_SANITY_DATASET,
  SANITY_API_READ_TOKEN: process.env.SANITY_API_READ_TOKEN,
  OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
  OPENROUTER_MODEL: process.env.OPENROUTER_MODEL,
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  GEMINI_MODEL: process.env.GEMINI_MODEL,
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL,
  RESEND_REPLY_TO_EMAIL: process.env.RESEND_REPLY_TO_EMAIL,
  RESEND_TEST_RECIPIENT: process.env.RESEND_TEST_RECIPIENT,
  DOCTOR_DASHBOARD_PIN: process.env.DOCTOR_DASHBOARD_PIN,
  APPOINTMENT_ACTION_SECRET: process.env.APPOINTMENT_ACTION_SECRET,
});
