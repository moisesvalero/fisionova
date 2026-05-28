# Recepcionista IA Fisioterapia Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a portfolio-ready physiotherapy clinic web app with an AI receptionist, functional local agenda, optional OpenAI responses, and optional Resend appointment emails.

**Architecture:** Keep clinic domain logic in `src/lib/receptionist`, render the product experience through small client components in `src/components/receptionist`, and isolate external services behind server routes. The app must work fully in demo mode without API keys while using OpenAI and Resend when configured.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript strict, Tailwind CSS 4, Vitest, Testing Library, optional OpenAI Responses API via `fetch`, optional Resend HTTP API via `fetch`.

---

## File Structure

- Create `src/lib/receptionist/types.ts`: shared appointment, treatment, therapist, chat, and email types.
- Create `src/lib/receptionist/demo-data.ts`: clinic profile, treatments, therapists, opening hours, seed appointments, and quick prompts.
- Create `src/lib/receptionist/agenda.ts`: pure agenda functions for availability, booking, updating, cancelling, and reset.
- Create `src/lib/receptionist/fallback.ts`: local receptionist intent handling for no-key/no-network mode.
- Create `src/lib/receptionist/email.ts`: pure email subject/body builders and simulated email records.
- Create `src/lib/receptionist/agenda.test.ts`: tests for booking, availability, cancellation, modification, and reset.
- Create `src/lib/receptionist/fallback.test.ts`: tests for common receptionist prompts.
- Create `src/components/receptionist/receptionist-experience.tsx`: client orchestrator for chat, localStorage agenda, and email actions.
- Create `src/components/receptionist/chat-panel.tsx`: chat transcript and composer.
- Create `src/components/receptionist/agenda-panel.tsx`: visible clinic agenda.
- Create `src/components/receptionist/clinic-overview.tsx`: services, hours, contact, and trust signals.
- Create `src/components/receptionist/email-log.tsx`: simulated/sent email timeline.
- Create `src/app/api/receptionist/route.ts`: optional OpenAI endpoint with fallback-compatible response shape.
- Create `src/app/api/email/route.ts`: optional Resend endpoint with simulated response when not configured.
- Modify `src/app/page.tsx`: replace template homepage with the clinic experience.
- Modify `src/config/site.ts`: update product SEO metadata.
- Modify `.env.example`: document optional OpenAI and Resend variables.
- Modify `src/lib/env.ts`: validate optional server-side OpenAI and Resend variables.

## Data Contracts

Use these shared shapes throughout the plan:

```ts
export type AppointmentStatus = "confirmed" | "cancelled";

export type Appointment = {
  id: string;
  patientName: string;
  patientEmail: string;
  patientPhone: string;
  treatmentId: string;
  therapistId: string;
  date: string;
  time: string;
  status: AppointmentStatus;
  notes?: string;
};

export type ReceptionAction =
  | { type: "reply"; message: string }
  | { type: "propose_slots"; message: string; slots: AppointmentSlot[] }
  | { type: "confirm_booking"; message: string; appointment: Appointment }
  | { type: "cancel_booking"; message: string; appointmentId: string }
  | { type: "modify_booking"; message: string; appointment: Appointment };
```

### Task 1: Domain Types And Demo Data

**Files:**

- Create: `src/lib/receptionist/types.ts`
- Create: `src/lib/receptionist/demo-data.ts`

- [ ] **Step 1: Create shared types**

Create `src/lib/receptionist/types.ts`:

```ts
export type Treatment = {
  id: string;
  name: string;
  durationMinutes: number;
  price: number;
  description: string;
};

export type Therapist = {
  id: string;
  name: string;
  specialty: string;
};

export type AppointmentStatus = "confirmed" | "cancelled";

export type Appointment = {
  id: string;
  patientName: string;
  patientEmail: string;
  patientPhone: string;
  treatmentId: string;
  therapistId: string;
  date: string;
  time: string;
  status: AppointmentStatus;
  notes?: string;
};

export type AppointmentSlot = {
  id: string;
  date: string;
  time: string;
  therapistId: string;
  treatmentId: string;
};

export type ChatMessage = {
  id: string;
  role: "assistant" | "user";
  content: string;
};

export type ReceptionAction =
  | { type: "reply"; message: string }
  | { type: "propose_slots"; message: string; slots: AppointmentSlot[] }
  | { type: "confirm_booking"; message: string; appointment: Appointment }
  | { type: "cancel_booking"; message: string; appointmentId: string }
  | { type: "modify_booking"; message: string; appointment: Appointment };

export type EmailEventType = "confirmation" | "modification" | "cancellation";

export type EmailLogItem = {
  id: string;
  type: EmailEventType;
  recipient: string;
  subject: string;
  body: string;
  status: "sent" | "simulated" | "failed";
  createdAt: string;
};
```

- [ ] **Step 2: Create demo clinic data**

Create `src/lib/receptionist/demo-data.ts`:

```ts
import type { Appointment, Therapist, Treatment } from "./types";

export const clinicProfile = {
  name: "FisioNova Clínica",
  tagline: "Fisioterapia cercana para volver a moverte con confianza.",
  address: "Calle Salud 18, Madrid",
  phone: "910 123 456",
  email: "hola@fisionova.demo",
  openingHours: "Lunes a viernes, 9:00-20:00",
};

export const treatments: Treatment[] = [
  {
    id: "general",
    name: "Fisioterapia general",
    durationMinutes: 50,
    price: 45,
    description:
      "Dolor muscular, contracturas, movilidad y recuperacion funcional.",
  },
  {
    id: "sports",
    name: "Fisioterapia deportiva",
    durationMinutes: 50,
    price: 50,
    description: "Prevencion y recuperacion de lesiones deportivas.",
  },
  {
    id: "postural",
    name: "Reeducacion postural",
    durationMinutes: 60,
    price: 55,
    description: "Trabajo guiado para espalda, cuello y habitos posturales.",
  },
];

export const therapists: Therapist[] = [
  { id: "marta", name: "Marta Ruiz", specialty: "Fisioterapia deportiva" },
  {
    id: "alvaro",
    name: "Alvaro Marin",
    specialty: "Dolor de espalda y postura",
  },
];

export const availableTimes = [
  "09:30",
  "10:30",
  "12:00",
  "16:30",
  "17:30",
  "18:30",
];

export const demoDates = [
  "2026-06-01",
  "2026-06-02",
  "2026-06-03",
  "2026-06-04",
  "2026-06-05",
];

export const seedAppointments: Appointment[] = [
  {
    id: "apt-demo-1",
    patientName: "Laura Gomez",
    patientEmail: "laura@example.com",
    patientPhone: "600 111 222",
    treatmentId: "sports",
    therapistId: "marta",
    date: "2026-06-02",
    time: "17:30",
    status: "confirmed",
    notes: "Molestia en rodilla derecha.",
  },
];

export const quickPrompts = [
  "Quiero cita el viernes por la tarde",
  "Cuanto cuesta la fisioterapia deportiva?",
  "Necesito cambiar mi cita",
  "Donde esta la clinica?",
];
```

- [ ] **Step 3: Type-check the new files**

Run: `npm run check`

Expected: TypeScript may fail if dependencies are not installed; if dependencies are installed, the new files compile with no errors.

### Task 2: Agenda Logic With Tests

**Files:**

- Create: `src/lib/receptionist/agenda.ts`
- Create: `src/lib/receptionist/agenda.test.ts`

- [ ] **Step 1: Write agenda tests**

Create `src/lib/receptionist/agenda.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import { seedAppointments } from "./demo-data";
import {
  bookAppointment,
  cancelAppointment,
  findAvailableSlots,
  resetAgenda,
  updateAppointment,
} from "./agenda";

describe("agenda", () => {
  it("does not offer an already booked slot", () => {
    const slots = findAvailableSlots(seedAppointments, {
      date: "2026-06-02",
      treatmentId: "sports",
    });

    expect(slots).not.toContainEqual(
      expect.objectContaining({
        date: "2026-06-02",
        time: "17:30",
        therapistId: "marta",
      }),
    );
  });

  it("books a new appointment in an available slot", () => {
    const appointment = bookAppointment(seedAppointments, {
      patientName: "Carlos Perez",
      patientEmail: "carlos@example.com",
      patientPhone: "600 333 444",
      treatmentId: "general",
      therapistId: "alvaro",
      date: "2026-06-03",
      time: "10:30",
      notes: "Dolor cervical.",
    });

    expect(appointment.patientName).toBe("Carlos Perez");
    expect(appointment.status).toBe("confirmed");
    expect(appointment.id).toMatch(/^apt-/);
  });

  it("rejects booking a taken slot", () => {
    expect(() =>
      bookAppointment(seedAppointments, {
        patientName: "Carlos Perez",
        patientEmail: "carlos@example.com",
        patientPhone: "600 333 444",
        treatmentId: "sports",
        therapistId: "marta",
        date: "2026-06-02",
        time: "17:30",
      }),
    ).toThrow("Slot is not available");
  });

  it("cancels an appointment", () => {
    const appointments = cancelAppointment(seedAppointments, "apt-demo-1");

    expect(appointments[0]?.status).toBe("cancelled");
  });

  it("updates an appointment to a free slot", () => {
    const appointments = updateAppointment(seedAppointments, "apt-demo-1", {
      date: "2026-06-03",
      time: "16:30",
      therapistId: "alvaro",
    });

    expect(appointments[0]).toMatchObject({
      date: "2026-06-03",
      time: "16:30",
      therapistId: "alvaro",
      status: "confirmed",
    });
  });

  it("resets to seed appointments", () => {
    expect(resetAgenda()).toEqual(seedAppointments);
  });
});
```

- [ ] **Step 2: Run tests and verify failure**

Run: `npm test -- src/lib/receptionist/agenda.test.ts`

Expected: FAIL because `src/lib/receptionist/agenda.ts` does not exist yet.

- [ ] **Step 3: Implement agenda functions**

Create `src/lib/receptionist/agenda.ts`:

```ts
import {
  availableTimes,
  demoDates,
  seedAppointments,
  therapists,
} from "./demo-data";
import type { Appointment, AppointmentSlot } from "./types";

type BookingInput = Omit<Appointment, "id" | "status">;

export function resetAgenda(): Appointment[] {
  return seedAppointments.map((appointment) => ({ ...appointment }));
}

export function isSlotAvailable(
  appointments: Appointment[],
  slot: Pick<AppointmentSlot, "date" | "time" | "therapistId">,
) {
  return !appointments.some(
    (appointment) =>
      appointment.status === "confirmed" &&
      appointment.date === slot.date &&
      appointment.time === slot.time &&
      appointment.therapistId === slot.therapistId,
  );
}

export function findAvailableSlots(
  appointments: Appointment[],
  filters: { date?: string; treatmentId?: string } = {},
): AppointmentSlot[] {
  return demoDates
    .filter((date) => !filters.date || date === filters.date)
    .flatMap((date) =>
      therapists.flatMap((therapist) =>
        availableTimes.map((time) => ({
          id: `${date}-${time}-${therapist.id}`,
          date,
          time,
          therapistId: therapist.id,
          treatmentId: filters.treatmentId ?? "general",
        })),
      ),
    )
    .filter((slot) => isSlotAvailable(appointments, slot))
    .slice(0, 6);
}

export function bookAppointment(
  appointments: Appointment[],
  input: BookingInput,
): Appointment {
  if (!isSlotAvailable(appointments, input)) {
    throw new Error("Slot is not available");
  }

  return {
    id: `apt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    ...input,
    status: "confirmed",
  };
}

export function cancelAppointment(
  appointments: Appointment[],
  appointmentId: string,
): Appointment[] {
  return appointments.map((appointment) =>
    appointment.id === appointmentId
      ? { ...appointment, status: "cancelled" }
      : appointment,
  );
}

export function updateAppointment(
  appointments: Appointment[],
  appointmentId: string,
  changes: Partial<
    Pick<Appointment, "date" | "time" | "therapistId" | "treatmentId" | "notes">
  >,
): Appointment[] {
  const current = appointments.find(
    (appointment) => appointment.id === appointmentId,
  );

  if (!current) {
    throw new Error("Appointment not found");
  }

  const next = { ...current, ...changes, status: "confirmed" as const };
  const others = appointments.filter(
    (appointment) => appointment.id !== appointmentId,
  );

  if (!isSlotAvailable(others, next)) {
    throw new Error("Slot is not available");
  }

  return appointments.map((appointment) =>
    appointment.id === appointmentId ? next : appointment,
  );
}
```

- [ ] **Step 4: Run agenda tests**

Run: `npm test -- src/lib/receptionist/agenda.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit domain agenda**

Run:

```bash
git add src/lib/receptionist/types.ts src/lib/receptionist/demo-data.ts src/lib/receptionist/agenda.ts src/lib/receptionist/agenda.test.ts
git commit -m "feat: add demo clinic agenda domain"
```

### Task 3: Local Receptionist Fallback And Email Builders

**Files:**

- Create: `src/lib/receptionist/fallback.ts`
- Create: `src/lib/receptionist/fallback.test.ts`
- Create: `src/lib/receptionist/email.ts`

- [ ] **Step 1: Write fallback tests**

Create `src/lib/receptionist/fallback.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import { seedAppointments } from "./demo-data";
import { buildAppointmentEmail } from "./email";
import { getFallbackReceptionAction } from "./fallback";

describe("fallback receptionist", () => {
  it("answers treatment prices", () => {
    const action = getFallbackReceptionAction(
      "cuanto cuesta la fisioterapia deportiva?",
      seedAppointments,
    );

    expect(action.type).toBe("reply");
    expect(action.message).toContain("50");
  });

  it("proposes slots for appointment requests", () => {
    const action = getFallbackReceptionAction(
      "quiero cita el viernes por la tarde",
      seedAppointments,
    );

    expect(action.type).toBe("propose_slots");
    if (action.type === "propose_slots") {
      expect(action.slots.length).toBeGreaterThan(0);
    }
  });

  it("builds a confirmation email", () => {
    const email = buildAppointmentEmail("confirmation", seedAppointments[0]!);

    expect(email.subject).toContain("confirmada");
    expect(email.body).toContain("Laura Gomez");
  });
});
```

- [ ] **Step 2: Run fallback tests and verify failure**

Run: `npm test -- src/lib/receptionist/fallback.test.ts`

Expected: FAIL because `fallback.ts` and `email.ts` do not exist.

- [ ] **Step 3: Implement email builder**

Create `src/lib/receptionist/email.ts`:

```ts
import { clinicProfile, therapists, treatments } from "./demo-data";
import type { Appointment, EmailEventType } from "./types";

export function buildAppointmentEmail(
  type: EmailEventType,
  appointment: Appointment,
) {
  const treatment = treatments.find(
    (item) => item.id === appointment.treatmentId,
  );
  const therapist = therapists.find(
    (item) => item.id === appointment.therapistId,
  );
  const typeText = {
    confirmation: "confirmada",
    modification: "modificada",
    cancellation: "cancelada",
  }[type];

  return {
    subject: `Tu cita ha sido ${typeText} - ${clinicProfile.name}`,
    body: [
      `Hola ${appointment.patientName},`,
      "",
      `Tu cita ha sido ${typeText}.`,
      `Tratamiento: ${treatment?.name ?? "Fisioterapia"}`,
      `Profesional: ${therapist?.name ?? "Equipo de fisioterapia"}`,
      `Fecha y hora: ${appointment.date} a las ${appointment.time}`,
      "",
      `Clinica: ${clinicProfile.address}`,
      `Telefono: ${clinicProfile.phone}`,
    ].join("\n"),
  };
}
```

- [ ] **Step 4: Implement local fallback**

Create `src/lib/receptionist/fallback.ts`:

```ts
import { clinicProfile, treatments } from "./demo-data";
import { findAvailableSlots } from "./agenda";
import type { Appointment, ReceptionAction } from "./types";

function normalize(input: string) {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

export function getFallbackReceptionAction(
  message: string,
  appointments: Appointment[],
): ReceptionAction {
  const text = normalize(message);

  if (
    text.includes("precio") ||
    text.includes("cuanto cuesta") ||
    text.includes("tarifa")
  ) {
    const prices = treatments
      .map((item) => `${item.name}: ${item.price} euros`)
      .join(", ");
    return {
      type: "reply",
      message: `Claro. Estas son nuestras tarifas principales: ${prices}.`,
    };
  }

  if (text.includes("horario")) {
    return {
      type: "reply",
      message: `Abrimos ${clinicProfile.openingHours}. Si quieres, puedo buscarte un hueco ahora mismo.`,
    };
  }

  if (
    text.includes("donde") ||
    text.includes("ubicacion") ||
    text.includes("direccion")
  ) {
    return {
      type: "reply",
      message: `Estamos en ${clinicProfile.address}. Tambien puedes llamarnos al ${clinicProfile.phone}.`,
    };
  }

  if (text.includes("cancel")) {
    return {
      type: "reply",
      message:
        "Puedo ayudarte a cancelar una cita. Para esta demo, selecciona una cita en la agenda y usa la accion de cancelar.",
    };
  }

  if (
    text.includes("cita") ||
    text.includes("reserv") ||
    text.includes("hueco")
  ) {
    const treatmentId = text.includes("deport") ? "sports" : "general";
    const slots = findAvailableSlots(appointments, { treatmentId });

    return {
      type: "propose_slots",
      message:
        "Tengo estos huecos disponibles. Elige uno y te preparo la confirmacion con tus datos.",
      slots,
    };
  }

  return {
    type: "reply",
    message:
      "Soy la recepcionista virtual de FisioNova. Puedo ayudarte con citas, precios, tratamientos, horarios y ubicacion.",
  };
}
```

- [ ] **Step 5: Run fallback tests**

Run: `npm test -- src/lib/receptionist/fallback.test.ts`

Expected: PASS.

- [ ] **Step 6: Commit fallback logic**

Run:

```bash
git add src/lib/receptionist/fallback.ts src/lib/receptionist/fallback.test.ts src/lib/receptionist/email.ts
git commit -m "feat: add local receptionist fallback"
```

### Task 4: Environment And Server Routes

**Files:**

- Modify: `src/lib/env.ts`
- Modify: `.env.example`
- Create: `src/app/api/receptionist/route.ts`
- Create: `src/app/api/email/route.ts`

- [ ] **Step 1: Extend env validation**

Modify `src/lib/env.ts` by adding optional keys to the schema and parse object:

```ts
OPENAI_API_KEY: z.string().min(1).optional(),
OPENAI_MODEL: z.string().min(1).default("gpt-5.4-nano"),
RESEND_API_KEY: z.string().min(1).optional(),
RESEND_FROM_EMAIL: z.email().optional(),
```

- [ ] **Step 2: Document env variables**

Append to `.env.example`:

```env
OPENAI_API_KEY=
OPENAI_MODEL=gpt-5.4-nano
RESEND_API_KEY=
RESEND_FROM_EMAIL=onboarding@resend.dev
```

- [ ] **Step 3: Create receptionist API route**

Create `src/app/api/receptionist/route.ts`:

```ts
import { NextResponse } from "next/server";

import { env } from "@/lib/env";
import { getFallbackReceptionAction } from "@/lib/receptionist/fallback";
import type { Appointment } from "@/lib/receptionist/types";

type ReceptionRequest = {
  message: string;
  appointments: Appointment[];
};

export async function POST(request: Request) {
  const body = (await request.json()) as ReceptionRequest;

  if (!env.OPENAI_API_KEY) {
    return NextResponse.json({
      provider: "fallback",
      action: getFallbackReceptionAction(body.message, body.appointments),
    });
  }

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: env.OPENAI_MODEL,
        input: [
          {
            role: "system",
            content:
              "Eres una recepcionista calida de una clinica de fisioterapia. Responde breve y pide solo los datos necesarios. Si no puedes confirmar una cita, propone huecos o explica el siguiente paso.",
          },
          {
            role: "user",
            content: body.message,
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI request failed: ${response.status}`);
    }

    const data = (await response.json()) as { output_text?: string };

    return NextResponse.json({
      provider: "openai",
      action: {
        type: "reply",
        message:
          data.output_text ??
          getFallbackReceptionAction(body.message, body.appointments).message,
      },
    });
  } catch {
    return NextResponse.json({
      provider: "fallback",
      action: getFallbackReceptionAction(body.message, body.appointments),
    });
  }
}
```

- [ ] **Step 4: Create email API route**

Create `src/app/api/email/route.ts`:

```ts
import { NextResponse } from "next/server";

import { env } from "@/lib/env";
import { buildAppointmentEmail } from "@/lib/receptionist/email";
import type { Appointment, EmailEventType } from "@/lib/receptionist/types";

type EmailRequest = {
  type: EmailEventType;
  appointment: Appointment;
};

export async function POST(request: Request) {
  const body = (await request.json()) as EmailRequest;
  const email = buildAppointmentEmail(body.type, body.appointment);

  if (!env.RESEND_API_KEY || !env.RESEND_FROM_EMAIL) {
    return NextResponse.json({
      status: "simulated",
      email,
    });
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: env.RESEND_FROM_EMAIL,
      to: body.appointment.patientEmail,
      subject: email.subject,
      text: email.body,
    }),
  });

  if (!response.ok) {
    return NextResponse.json({ status: "failed", email }, { status: 200 });
  }

  return NextResponse.json({ status: "sent", email });
}
```

- [ ] **Step 5: Run type-check**

Run: `npm run check`

Expected: PASS after dependencies are installed; otherwise document missing dependencies.

- [ ] **Step 6: Commit server routes**

Run:

```bash
git add src/lib/env.ts .env.example src/app/api/receptionist/route.ts src/app/api/email/route.ts
git commit -m "feat: add optional AI and email routes"
```

### Task 5: Receptionist UI Components

**Files:**

- Create: `src/components/receptionist/chat-panel.tsx`
- Create: `src/components/receptionist/agenda-panel.tsx`
- Create: `src/components/receptionist/clinic-overview.tsx`
- Create: `src/components/receptionist/email-log.tsx`
- Create: `src/components/receptionist/receptionist-experience.tsx`

- [ ] **Step 1: Create chat panel**

Create `src/components/receptionist/chat-panel.tsx` with props for messages, quick prompts, pending state, submit handler, and selected slot callback. Use `Button`, `Send`, and `CalendarCheck` from `lucide-react`.

- [ ] **Step 2: Create agenda panel**

Create `src/components/receptionist/agenda-panel.tsx` with props for appointments, selected appointment callback, cancel callback, and reset callback. Resolve treatment/therapist names from demo data and show confirmed/cancelled status.

- [ ] **Step 3: Create clinic overview**

Create `src/components/receptionist/clinic-overview.tsx` showing clinic profile, treatments with prices, contact, and opening hours.

- [ ] **Step 4: Create email log**

Create `src/components/receptionist/email-log.tsx` rendering `EmailLogItem[]` and empty state text "Los emails apareceran aqui al confirmar, modificar o cancelar citas."

- [ ] **Step 5: Create experience orchestrator**

Create `src/components/receptionist/receptionist-experience.tsx` as a `"use client"` component that:

- initializes appointments from `localStorage` or `resetAgenda()`;
- initializes assistant greeting;
- calls `/api/receptionist` on message submit;
- renders proposed slot buttons when action is `propose_slots`;
- books a selected slot with demo patient details if the user has not provided full data yet;
- calls `/api/email` after confirmation/cancellation/modification;
- persists appointments and email log in `localStorage`;
- exposes reset demo action.

- [ ] **Step 6: Run type-check**

Run: `npm run check`

Expected: PASS.

- [ ] **Step 7: Commit UI components**

Run:

```bash
git add src/components/receptionist
git commit -m "feat: add receptionist interface components"
```

### Task 6: Homepage, SEO, And Styling

**Files:**

- Modify: `src/app/page.tsx`
- Modify: `src/config/site.ts`
- Modify: `src/app/globals.css` if the palette needs small tuning.

- [ ] **Step 1: Replace homepage**

Modify `src/app/page.tsx` so it imports `ReceptionistExperience`, `JsonLd`, and SEO JSON-LD helpers, then renders a full-page clinic interface instead of the template starter content.

- [ ] **Step 2: Update site config**

Modify `src/config/site.ts`:

```ts
export const siteConfig = {
  name: "FisioNova IA",
  shortName: "FisioNova",
  description:
    "Demo de recepcionista IA para una clinica de fisioterapia con agenda funcional y confirmaciones por email.",
  url: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
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
  ],
};
```

- [ ] **Step 3: Check visual constraints**

Run: `npm run lint`

Expected: PASS. Fix any JSX accessibility or lint issue before continuing.

- [ ] **Step 4: Commit homepage**

Run:

```bash
git add src/app/page.tsx src/config/site.ts src/app/globals.css
git commit -m "feat: build physiotherapy AI receptionist homepage"
```

### Task 7: Verification And Browser QA

**Files:**

- Modify only files needed to fix verification failures.

- [ ] **Step 1: Install dependencies if needed**

Run: `npm install`

Expected: `node_modules` exists and project scripts can resolve local dependencies. Commit `package-lock.json` only if it changes for a real dependency reason.

- [ ] **Step 2: Run focused tests**

Run: `npm test -- src/lib/receptionist/agenda.test.ts src/lib/receptionist/fallback.test.ts`

Expected: PASS.

- [ ] **Step 3: Run project checks**

Run:

```bash
npm run format:check
npm run lint
npm run check
npm test
npm run build
```

Expected: all PASS. If any command fails due to external config or missing credentials, document the exact failure and whether it affects runtime.

- [ ] **Step 4: Run local app**

Run: `npm run dev`

Expected: Next dev server starts at `http://localhost:3000` or another printed port.

- [ ] **Step 5: Browser smoke test**

Open the local URL and verify:

- homepage loads;
- chat accepts a message;
- price prompt returns an answer;
- appointment prompt proposes slots;
- selecting a slot adds it to the agenda;
- email log shows sent/simulated confirmation;
- reset demo restores seed appointment.

- [ ] **Step 6: Final commit**

Run:

```bash
git status --short
git add <only modified implementation files>
git commit -m "chore: verify receptionist demo"
```

Only create this commit if verification fixes changed tracked files.

## Self-Review

- Spec coverage: The plan includes OpenAI, fallback local, visible agenda, localStorage persistence, Resend/simulated email, clinic UI, SEO, tests, and final verification.
- Placeholder scan: No deferred-work markers or undefined future work remain in executable tasks.
- Type consistency: `Appointment`, `ReceptionAction`, `AppointmentSlot`, `EmailEventType`, and `EmailLogItem` are defined in Task 1 and reused consistently in later tasks.
