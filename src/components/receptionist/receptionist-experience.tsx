"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  CalendarSearch,
  CheckCircle2,
  Ear,
  Mail,
  Sparkles,
} from "lucide-react";
import Image from "next/image";

import { AgendaPanel } from "@/components/receptionist/agenda-panel";
import { ChatPanel } from "@/components/receptionist/chat-panel";
import { EmailLog } from "@/components/receptionist/email-log";
import {
  bookAppointment,
  findAvailableSlots,
  resetAgenda,
  updateAppointment,
} from "@/lib/receptionist/agenda";
import type {
  Appointment,
  AppointmentSlot,
  ChatMessage,
  EmailEventType,
  EmailLogItem,
  ReceptionAction,
} from "@/lib/receptionist/types";

const AGENDA_STORAGE_KEY = "fisionova-agenda";
const EMAIL_STORAGE_KEY = "fisionova-email-log";

const assistantGreeting: ChatMessage = {
  id: "assistant-greeting",
  role: "assistant",
  content:
    "Hola, soy la recepcionista IA de FisioNova. Puedo ayudarte a pedir cita, cambiarla, cancelarla o resolver dudas sobre precios y tratamientos.",
};

function readStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") {
    return fallback;
  }

  const value = window.localStorage.getItem(key);

  if (!value) {
    return fallback;
  }

  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function createDemoAppointment(
  slot: AppointmentSlot,
  appointments: Appointment[],
) {
  return bookAppointment(appointments, {
    patientName: "Visitante Portfolio",
    patientEmail: "visitante@example.com",
    patientPhone: "600 000 000",
    treatmentId: slot.treatmentId,
    therapistId: slot.therapistId,
    date: slot.date,
    time: slot.time,
    notes: "Cita creada desde la demo de recepcionista IA.",
  });
}

export function ReceptionistExperience() {
  const [appointments, setAppointments] = useState<Appointment[]>(() =>
    resetAgenda(),
  );
  const [emails, setEmails] = useState<EmailLogItem[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([assistantGreeting]);
  const [proposedSlots, setProposedSlots] = useState<AppointmentSlot[]>([]);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    queueMicrotask(() => {
      setAppointments(readStorage(AGENDA_STORAGE_KEY, resetAgenda()));
      setEmails(readStorage(EMAIL_STORAGE_KEY, []));
    });
  }, []);

  useEffect(() => {
    window.localStorage.setItem(
      AGENDA_STORAGE_KEY,
      JSON.stringify(appointments),
    );
  }, [appointments]);

  useEffect(() => {
    window.localStorage.setItem(EMAIL_STORAGE_KEY, JSON.stringify(emails));
  }, [emails]);

  const sortedAppointments = useMemo(
    () =>
      [...appointments].sort((a, b) =>
        `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`),
      ),
    [appointments],
  );

  async function sendEmail(type: EmailEventType, appointment: Appointment) {
    const response = await fetch("/api/email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, appointment }),
    });
    const payload = (await response.json()) as {
      status: EmailLogItem["status"];
      email: Pick<EmailLogItem, "subject" | "body">;
    };

    setEmails((current) => [
      {
        id: `email-${Date.now()}`,
        type,
        recipient: appointment.patientEmail,
        subject: payload.email.subject,
        body: payload.email.body,
        status: payload.status,
        createdAt: new Date().toISOString(),
      },
      ...current,
    ]);
  }

  function addAssistantMessage(content: string) {
    setMessages((current) => [
      ...current,
      {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content,
      },
    ]);
  }

  async function handleSubmit(message: string) {
    setPending(true);
    setMessages((current) => [
      ...current,
      { id: `user-${Date.now()}`, role: "user", content: message },
    ]);

    try {
      const response = await fetch("/api/receptionist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, appointments }),
      });
      const payload = (await response.json()) as { action: ReceptionAction };

      addAssistantMessage(payload.action.message);
      setProposedSlots(
        payload.action.type === "propose_slots" ? payload.action.slots : [],
      );
    } catch {
      addAssistantMessage(
        "Ahora mismo no puedo conectar con la IA, pero la demo local sigue funcionando. Prueba con pedir cita o consultar precios.",
      );
    } finally {
      setPending(false);
    }
  }

  async function handleSelectSlot(slot: AppointmentSlot) {
    const appointment = createDemoAppointment(slot, appointments);
    setAppointments((current) => [...current, appointment]);
    setProposedSlots([]);
    addAssistantMessage(
      `Perfecto, te he reservado el ${appointment.date} a las ${appointment.time}. También he preparado el email de confirmación.`,
    );
    await sendEmail("confirmation", appointment);
  }

  async function handleCancel(appointment: Appointment) {
    setAppointments((current) =>
      current.map((item) =>
        item.id === appointment.id ? { ...item, status: "cancelled" } : item,
      ),
    );
    addAssistantMessage(
      `He cancelado la cita del ${appointment.date} a las ${appointment.time}.`,
    );
    await sendEmail("cancellation", { ...appointment, status: "cancelled" });
  }

  async function handleMove(appointment: Appointment) {
    const [slot] = findAvailableSlots(appointments, {
      treatmentId: appointment.treatmentId,
    });

    if (!slot) {
      addAssistantMessage(
        "No veo huecos libres para mover esa cita ahora mismo.",
      );
      return;
    }

    const nextAppointments = updateAppointment(appointments, appointment.id, {
      date: slot.date,
      time: slot.time,
      therapistId: slot.therapistId,
    });
    const moved = nextAppointments.find((item) => item.id === appointment.id);

    setAppointments(nextAppointments);

    if (moved) {
      addAssistantMessage(
        `He movido la cita al ${moved.date} a las ${moved.time} y preparo el email con el cambio.`,
      );
      await sendEmail("modification", moved);
    }
  }

  function handleReset() {
    setAppointments(resetAgenda());
    setEmails([]);
    setProposedSlots([]);
    setMessages([assistantGreeting]);
  }

  return (
    <div className="bg-background text-foreground min-h-screen">
      <section className="relative min-h-screen w-full overflow-hidden">
        <Image
          src="/images/clinic-hero.jpg"
          alt="Sala de tratamiento de fisioterapia moderna y luminosa"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="from-charcoal/70 via-charcoal/40 to-charcoal/80 absolute inset-0 bg-gradient-to-b" />
        <div className="from-charcoal/60 absolute inset-0 bg-gradient-to-r via-transparent to-transparent" />

        <nav className="absolute inset-x-0 top-0 z-20 flex items-center justify-between px-6 py-6 lg:px-12">
          <div className="text-cream flex items-center gap-2">
            <div className="bg-sage flex h-7 w-7 items-center justify-center rounded-md">
              <Sparkles
                className="text-sage-foreground h-3.5 w-3.5"
                strokeWidth={2.5}
                aria-hidden="true"
              />
            </div>
            <span className="font-display text-lg tracking-tight">
              FisioNova <span className="opacity-60">IA</span>
            </span>
          </div>
          <a
            href="#cta"
            className="text-cream/90 hover:text-cream hidden items-center gap-1.5 text-sm transition-colors sm:inline-flex"
          >
            Probar demo <ArrowRight className="h-3.5 w-3.5" />
          </a>
        </nav>

        <div className="relative z-10 mx-auto grid min-h-screen max-w-7xl items-center gap-10 px-6 pt-32 pb-20 lg:grid-cols-12 lg:gap-8 lg:px-12 lg:pt-40 lg:pb-28">
          <div className="animate-fade-up text-cream lg:col-span-6">
            <div className="text-cream/70 mb-6 inline-flex items-center gap-2 text-xs tracking-[0.18em] uppercase">
              <span className="animate-pulse-dot bg-sage h-1.5 w-1.5 rounded-full" />
              FisioNova IA, demo en vivo
            </div>
            <h1 className="font-display text-cream text-4xl leading-[1.05] sm:text-5xl lg:text-6xl">
              Tu recepcionista IA
              <br />
              <span className="text-sage italic">para clínicas</span> de
              fisioterapia
            </h1>
            <p className="text-cream/80 mt-6 max-w-xl text-lg leading-relaxed">
              Atiende pacientes, busca huecos en la agenda, confirma citas y
              envía emails automáticamente. Trabaja contigo, no en lugar de ti.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="#chat"
                className="bg-cream text-charcoal hover:bg-cream/90 inline-flex items-center gap-2 rounded-md px-5 py-3 text-sm font-medium transition-colors"
              >
                Probar la recepcionista <ArrowRight className="h-4 w-4" />
              </a>
              <a
                href="#how"
                className="border-cream/30 text-cream hover:bg-cream/10 inline-flex items-center gap-2 rounded-md border px-5 py-3 text-sm font-medium transition-colors"
              >
                Cómo funciona
              </a>
            </div>
          </div>

          <div
            id="chat"
            className="animate-fade-up flex flex-col items-center gap-4 lg:col-span-6 lg:items-end"
          >
            <ChatPanel
              messages={messages}
              pending={pending}
              proposedSlots={proposedSlots}
              onSubmit={handleSubmit}
              onSelectSlot={handleSelectSlot}
            />
            <div className="w-full max-w-md">
              <AgendaPanel
                appointments={sortedAppointments.slice(0, 3)}
                onCancel={handleCancel}
                onMove={handleMove}
                onReset={handleReset}
              />
            </div>
          </div>
        </div>
      </section>

      <HowItWorks />

      <section className="bg-secondary/40 px-6 py-24 lg:px-12 lg:py-32">
        <div className="mx-auto grid max-w-7xl items-start gap-12 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <span className="text-sage text-xs tracking-[0.18em] uppercase">
              Agenda
            </span>
            <h2 className="font-display mt-3 text-3xl leading-tight lg:text-5xl">
              Agenda funcional, no decorativa
            </h2>
            <p className="text-muted-foreground mt-4 text-lg leading-relaxed">
              La recepcionista ve los huecos reales de cada profesional, respeta
              duraciones de tratamiento y nunca propone una hora ocupada.
            </p>
            <ul className="mt-8 space-y-3 text-sm">
              {[
                "Múltiples profesionales y tratamientos",
                "Citas persistentes en el navegador",
                "Confirmaciones automáticas por email",
              ].map((feature) => (
                <li key={feature} className="flex items-center gap-3">
                  <CheckCircle2
                    className="text-sage h-4 w-4 shrink-0"
                    strokeWidth={2}
                    aria-hidden="true"
                  />
                  {feature}
                </li>
              ))}
            </ul>
          </div>
          <div className="space-y-6 lg:col-span-7">
            <AgendaPanel
              appointments={sortedAppointments}
              onCancel={handleCancel}
              onMove={handleMove}
              onReset={handleReset}
            />
            <EmailLog emails={emails} />
          </div>
        </div>
      </section>

      <AutomationSection />
      <FinalCTA />
    </div>
  );
}

function HowItWorks() {
  const steps = [
    {
      icon: Ear,
      title: "Escucha",
      text: "Entiende la peticion del paciente en lenguaje natural.",
    },
    {
      icon: CalendarSearch,
      title: "Busca hueco",
      text: "Consulta la agenda y propone el mejor momento.",
    },
    {
      icon: CheckCircle2,
      title: "Confirma",
      text: "Reserva la cita y la bloquea en el calendario.",
    },
    {
      icon: Mail,
      title: "Envía email",
      text: "Manda confirmación o cancelación automáticamente.",
    },
  ];

  return (
    <section id="how" className="px-6 py-24 lg:px-12 lg:py-32">
      <div className="mx-auto max-w-7xl">
        <header className="mb-16 max-w-2xl">
          <span className="text-sage text-xs tracking-[0.18em] uppercase">
            Flujo
          </span>
          <h2 className="font-display mt-3 text-3xl leading-tight lg:text-5xl">
            Cómo trabaja la recepcionista
          </h2>
          <p className="text-muted-foreground mt-4 text-lg">
            Cuatro pasos, una conversación. Sin formularios, sin esperas.
          </p>
        </header>

        <ol className="border-border bg-border grid overflow-hidden rounded-xl border md:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, index) => (
            <li
              key={step.title}
              className="group bg-background hover:bg-secondary/40 relative flex flex-col gap-4 p-8 transition-colors lg:p-10"
            >
              <div className="flex items-center justify-between">
                <div className="bg-sage/15 flex h-11 w-11 items-center justify-center rounded-md">
                  <step.icon
                    className="text-sage h-5 w-5"
                    strokeWidth={1.75}
                    aria-hidden="true"
                  />
                </div>
                <span className="font-display text-muted-foreground/40 text-3xl tabular-nums">
                  0{index + 1}
                </span>
              </div>
              <div>
                <h3 className="mb-2 text-xl">{step.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {step.text}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function AutomationSection() {
  const items = [
    {
      tag: "OpenAI",
      title: "Conversación natural",
      text: "Modelos de lenguaje para entender peticiones reales de pacientes en español.",
    },
    {
      tag: "Demo mode",
      title: "Fallback inteligente",
      text: "Si la IA no esta disponible, el modo demo mantiene la experiencia operativa.",
    },
    {
      tag: "Resend",
      title: "Emails transaccionales",
      text: "Confirmaciones, modificaciones y cancelaciones enviadas al instante.",
    },
  ];

  return (
    <section className="px-6 py-24 lg:px-12 lg:py-32">
      <div className="mx-auto max-w-7xl">
        <header className="mb-16 max-w-2xl">
          <span className="text-sage text-xs tracking-[0.18em] uppercase">
            Tecnología
          </span>
          <h2 className="font-display mt-3 text-3xl leading-tight lg:text-5xl">
            Automatización con IA
          </h2>
        </header>
        <div className="grid gap-6 md:grid-cols-3">
          {items.map((item) => (
            <article
              key={item.title}
              className="border-border bg-card hover:border-sage/40 rounded-xl border p-8 transition-colors"
            >
              <span className="text-clay text-[11px] font-medium tracking-widest uppercase">
                {item.tag}
              </span>
              <h3 className="font-display mt-4 mb-3 text-2xl">{item.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {item.text}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCTA() {
  return (
    <section
      id="cta"
      className="bg-charcoal text-cream relative overflow-hidden px-6 py-28 lg:px-12 lg:py-40"
    >
      <div className="relative mx-auto max-w-3xl text-center">
        <h2 className="font-display text-cream text-4xl leading-tight lg:text-6xl">
          Prueba la recepcionista{" "}
          <span className="text-sage italic">ahora</span>
        </h2>
        <p className="text-cream/70 mt-6 text-lg">
          Habla con FisioNova IA como lo haría un paciente real.
        </p>
        <a
          href="#chat"
          className="bg-cream text-charcoal hover:bg-sage hover:text-sage-foreground mt-10 inline-flex items-center gap-2 rounded-md px-6 py-3.5 text-sm font-medium transition-colors"
        >
          Probar la recepcionista <ArrowRight className="h-4 w-4" />
        </a>
      </div>
    </section>
  );
}
