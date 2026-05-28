"use client";

import { FormEvent, useState } from "react";
import { ArrowLeft, LockKeyhole } from "lucide-react";
import Link from "next/link";

import { AgendaPanel } from "@/components/receptionist/agenda-panel";
import { Button } from "@/components/ui/button";
import { findAvailableSlots } from "@/lib/receptionist/agenda";
import type { Appointment, EmailEventType } from "@/lib/receptionist/types";

type AppointmentsPayload = {
  appointments: Appointment[];
};

function sortAppointments(appointments: Appointment[]) {
  return [...appointments].sort((a, b) =>
    `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`),
  );
}

async function sendEmail(type: EmailEventType, appointment: Appointment) {
  await fetch("/api/email", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type, appointment }),
  });
}

export function DoctorAgenda() {
  const [pin, setPin] = useState("");
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [authorized, setAuthorized] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function loadAgenda(nextPin = pin) {
    setLoading(true);
    setError("");

    const response = await fetch("/api/appointments", {
      headers: { "x-doctor-pin": nextPin },
    });

    if (!response.ok) {
      setAuthorized(false);
      setError("PIN incorrecto. En demo puedes usar 1234.");
      setLoading(false);
      return;
    }

    const payload = (await response.json()) as AppointmentsPayload;
    setAppointments(sortAppointments(payload.appointments));
    setAuthorized(true);
    setLoading(false);
  }

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await loadAgenda(pin);
  }

  async function patchAgenda(body: object) {
    setLoading(true);
    setError("");

    const response = await fetch("/api/appointments", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "x-doctor-pin": pin,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      setError("No se pudo actualizar la agenda.");
      setLoading(false);
      return null;
    }

    const payload = (await response.json()) as AppointmentsPayload;
    setAppointments(sortAppointments(payload.appointments));
    setLoading(false);

    return payload.appointments;
  }

  async function handleCancel(appointment: Appointment) {
    await patchAgenda({ action: "cancel", appointmentId: appointment.id });
    await sendEmail("cancellation", { ...appointment, status: "cancelled" });
  }

  async function handleMove(appointment: Appointment) {
    const [slot] = findAvailableSlots(appointments, {
      treatmentId: appointment.treatmentId,
    });

    if (!slot) {
      setError("No hay huecos disponibles para mover esta cita.");
      return;
    }

    const updated = await patchAgenda({
      action: "move",
      appointmentId: appointment.id,
      slot,
    });
    const moved = updated?.find((item) => item.id === appointment.id);

    if (moved) {
      await sendEmail("modification", moved);
    }
  }

  async function handleReset() {
    await patchAgenda({ action: "reset" });
  }

  return (
    <main className="bg-background text-foreground min-h-screen px-6 py-8 lg:px-12">
      <div className="mx-auto max-w-6xl">
        <Link
          href="/"
          className="text-muted-foreground hover:text-foreground mb-8 inline-flex items-center gap-2 text-sm transition-colors"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Volver a la web pública
        </Link>

        <header className="mb-10 max-w-3xl">
          <span className="text-sage text-xs tracking-[0.18em] uppercase">
            Backend privado
          </span>
          <h1 className="font-display mt-3 text-4xl leading-tight lg:text-6xl">
            Agenda del médico
          </h1>
          <p className="text-muted-foreground mt-4 text-lg leading-relaxed">
            Este panel simula la zona privada de la clínica. Aquí sí se ven las
            citas completas y se pueden mover, cancelar o restablecer.
          </p>
        </header>

        {!authorized ? (
          <section className="glass shadow-elegant border-border/60 max-w-md rounded-xl border p-6">
            <div className="mb-5 flex items-center gap-3">
              <div className="bg-sage/15 flex h-10 w-10 items-center justify-center rounded-md">
                <LockKeyhole className="text-sage h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <h2 className="text-base font-semibold">Acceso privado</h2>
                <p className="text-muted-foreground text-sm">
                  Introduce el PIN del médico.
                </p>
              </div>
            </div>
            <form className="space-y-4" onSubmit={handleLogin}>
              <label className="block">
                <span className="mb-2 block text-sm font-medium">PIN</span>
                <input
                  className="border-border bg-background focus:ring-ring/40 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2"
                  value={pin}
                  onChange={(event) => setPin(event.target.value)}
                  type="password"
                  inputMode="numeric"
                  placeholder="1234"
                />
              </label>
              {error ? (
                <p className="text-clay text-sm" role="alert">
                  {error}
                </p>
              ) : null}
              <Button type="submit" disabled={loading}>
                {loading ? "Comprobando..." : "Entrar"}
              </Button>
            </form>
          </section>
        ) : (
          <section className="space-y-4">
            {error ? (
              <p className="text-clay text-sm" role="alert">
                {error}
              </p>
            ) : null}
            <AgendaPanel
              appointments={appointments}
              onCancel={handleCancel}
              onMove={handleMove}
              onReset={handleReset}
            />
          </section>
        )}
      </div>
    </main>
  );
}
