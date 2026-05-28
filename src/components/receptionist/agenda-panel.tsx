"use client";

import { CalendarDays, RotateCcw, Shuffle, XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { therapists, treatments } from "@/lib/receptionist/demo-data";
import type { Appointment } from "@/lib/receptionist/types";

type AgendaPanelProps = {
  appointments: Appointment[];
  onCancel: (appointment: Appointment) => void;
  onMove: (appointment: Appointment) => void;
  onReset: () => void;
};

function resolveTreatment(id: string) {
  return treatments.find((treatment) => treatment.id === id)?.name ?? id;
}

function resolveTherapist(id: string) {
  return therapists.find((therapist) => therapist.id === id)?.name ?? id;
}

export function AgendaPanel({
  appointments,
  onCancel,
  onMove,
  onReset,
}: AgendaPanelProps) {
  return (
    <section className="bg-card overflow-hidden rounded-lg border border-zinc-200 shadow-[0_18px_60px_rgba(24,35,38,0.12)]">
      <header className="flex items-center justify-between gap-3 border-b border-zinc-200 bg-[linear-gradient(180deg,oklch(0.995_0.006_78),oklch(0.96_0.014_78))] p-5">
        <div>
          <p className="text-sm font-semibold tracking-tight">
            Agenda de la clinica
          </p>
          <p className="text-xs text-zinc-500">
            Citas visibles y persistentes en esta demo
          </p>
        </div>
        <Button type="button" size="icon" variant="outline" onClick={onReset}>
          <RotateCcw className="size-4" aria-hidden="true" />
          <span className="sr-only">Restablecer demo</span>
        </Button>
      </header>

      <div className="divide-y divide-zinc-200">
        {appointments.map((appointment) => (
          <article key={appointment.id} className="space-y-4 p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium">{appointment.patientName}</p>
                <p className="text-sm text-zinc-600">
                  {resolveTreatment(appointment.treatmentId)} con{" "}
                  {resolveTherapist(appointment.therapistId)}
                </p>
              </div>
              <span
                className={`rounded-md px-2.5 py-1 text-xs font-semibold ${
                  appointment.status === "confirmed"
                    ? "bg-accent text-accent-foreground"
                    : "bg-zinc-200 text-zinc-600"
                }`}
              >
                {appointment.status === "confirmed"
                  ? "Confirmada"
                  : "Cancelada"}
              </span>
            </div>

            <p className="bg-muted flex items-center gap-2 rounded-md px-3 py-2 text-sm text-zinc-700">
              <CalendarDays
                className="text-primary size-4"
                aria-hidden="true"
              />
              {appointment.date} a las {appointment.time}
            </p>

            {appointment.status === "confirmed" ? (
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => onMove(appointment)}
                >
                  <Shuffle className="size-4" aria-hidden="true" />
                  Mover
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => onCancel(appointment)}
                >
                  <XCircle className="size-4" aria-hidden="true" />
                  Cancelar
                </Button>
              </div>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}
