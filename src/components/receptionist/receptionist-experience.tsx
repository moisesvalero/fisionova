"use client";

import { useEffect, useMemo, useState } from "react";

import { AgendaPanel } from "@/components/receptionist/agenda-panel";
import { ChatPanel } from "@/components/receptionist/chat-panel";
import { ClinicOverview } from "@/components/receptionist/clinic-overview";
import { EmailLog } from "@/components/receptionist/email-log";
import {
  bookAppointment,
  findAvailableSlots,
  resetAgenda,
  updateAppointment,
} from "@/lib/receptionist/agenda";
import { quickPrompts } from "@/lib/receptionist/demo-data";
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

function createDemoAppointment(slot: AppointmentSlot, appointments: Appointment[]) {
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
    setAppointments(readStorage(AGENDA_STORAGE_KEY, resetAgenda()));
    setEmails(readStorage(EMAIL_STORAGE_KEY, []));
  }, []);

  useEffect(() => {
    window.localStorage.setItem(AGENDA_STORAGE_KEY, JSON.stringify(appointments));
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
      `Perfecto, te he reservado el ${appointment.date} a las ${appointment.time}. Tambien he preparado el email de confirmacion.`,
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
      addAssistantMessage("No veo huecos libres para mover esa cita ahora mismo.");
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
    <div className="mx-auto grid w-full max-w-7xl gap-8 px-6 py-8 sm:px-10 lg:grid-cols-[1fr_420px]">
      <div className="space-y-8">
        <ClinicOverview />
        <ChatPanel
          messages={messages}
          pending={pending}
          quickPrompts={quickPrompts}
          proposedSlots={proposedSlots}
          onPrompt={handleSubmit}
          onSubmit={handleSubmit}
          onSelectSlot={handleSelectSlot}
        />
      </div>

      <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
        <AgendaPanel
          appointments={sortedAppointments}
          onCancel={handleCancel}
          onMove={handleMove}
          onReset={handleReset}
        />
        <EmailLog emails={emails} />
      </aside>
    </div>
  );
}
