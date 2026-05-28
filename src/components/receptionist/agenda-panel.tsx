"use client";

import {
  CalendarDays,
  CheckCircle2,
  RotateCcw,
  Shuffle,
  XCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { therapists, treatments } from "@/lib/receptionist/demo-data";
import type { Appointment } from "@/lib/receptionist/types";

type AgendaPanelProps = {
  appointments: Appointment[];
  onConfirm: (appointment: Appointment) => void;
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

function formatShortDate(date: string) {
  const [, month, day] = date.split("-");

  return month && day ? `${day}/${month}` : date;
}

export function AgendaPanel({
  appointments,
  onConfirm,
  onCancel,
  onMove,
  onReset,
}: AgendaPanelProps) {
  return (
    <section className="glass shadow-elegant border-border/60 w-full overflow-hidden rounded-xl border">
      <header className="border-border/50 flex items-center justify-between border-b px-5 py-4">
        <div className="flex items-center gap-2">
          <CalendarDays className="text-muted-foreground h-4 w-4" />
          <span className="text-sm font-medium">Agenda de la clínica</span>
        </div>
        <Button type="button" size="icon" variant="ghost" onClick={onReset}>
          <RotateCcw className="size-4" aria-hidden="true" />
          <span className="sr-only">Restablecer demo</span>
        </Button>
      </header>

      <ul className="divide-border/50 divide-y">
        {appointments.map((appointment) => (
          <li key={appointment.id} className="px-5 py-3.5">
            <div className="grid grid-cols-[64px_8px_1fr_auto] items-center gap-4">
              <div className="w-16">
                <span className="font-display text-foreground block text-lg leading-none tabular-nums">
                  {appointment.time}
                </span>
                <span className="text-muted-foreground mt-1 block text-[10px] tabular-nums">
                  {formatShortDate(appointment.date)}
                </span>
              </div>
              <span
                className={`h-2 w-2 rounded-full ${
                  appointment.status === "confirmed"
                    ? "bg-sage"
                    : appointment.status === "pending"
                      ? "bg-clinical"
                      : "bg-clay"
                }`}
                aria-hidden="true"
              />
              <div className="min-w-0">
                <p className="text-foreground truncate text-sm">
                  {appointment.patientName}
                </p>
                <p className="text-muted-foreground truncate text-xs">
                  {resolveTreatment(appointment.treatmentId)} con{" "}
                  {resolveTherapist(appointment.therapistId)}
                </p>
              </div>
              <span
                className={`rounded px-2 py-0.5 text-[11px] font-medium ${
                  appointment.status === "confirmed"
                    ? "bg-sage/10 text-sage"
                    : appointment.status === "pending"
                      ? "bg-clinical/10 text-clinical"
                      : "bg-clay/10 text-clay"
                }`}
              >
                {appointment.status === "confirmed"
                  ? "Confirmada"
                  : appointment.status === "pending"
                    ? "Pendiente"
                    : "Cancelada"}
              </span>
            </div>

            {appointment.status !== "cancelled" ? (
              <div className="mt-3 flex justify-end gap-2">
                {appointment.status === "pending" ? (
                  <Button
                    type="button"
                    size="sm"
                    className="h-8"
                    onClick={() => onConfirm(appointment)}
                  >
                    <CheckCircle2 className="size-4" aria-hidden="true" />
                    Confirmar
                  </Button>
                ) : null}
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="h-8"
                  onClick={() => onMove(appointment)}
                >
                  <Shuffle className="size-4" aria-hidden="true" />
                  Mover
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="h-8"
                  onClick={() => onCancel(appointment)}
                >
                  <XCircle className="size-4" aria-hidden="true" />
                  Cancelar
                </Button>
              </div>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
