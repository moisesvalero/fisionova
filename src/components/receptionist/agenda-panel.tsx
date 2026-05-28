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
    <section className="glass shadow-elegant border-border/60 w-full overflow-hidden rounded-xl border">
      <header className="border-border/50 flex items-center justify-between border-b px-5 py-4">
        <div className="flex items-center gap-2">
          <CalendarDays className="text-muted-foreground h-4 w-4" />
          <span className="text-sm font-medium">Agenda de la clinica</span>
        </div>
        <Button type="button" size="icon" variant="ghost" onClick={onReset}>
          <RotateCcw className="size-4" aria-hidden="true" />
          <span className="sr-only">Restablecer demo</span>
        </Button>
      </header>

      <ul className="divide-border/50 divide-y">
        {appointments.map((appointment) => (
          <li key={appointment.id} className="px-5 py-3.5">
            <div className="grid grid-cols-[56px_8px_1fr_auto] items-center gap-4">
              <span className="font-display text-foreground w-14 text-lg tabular-nums">
                {appointment.time}
              </span>
              <span
                className={`h-2 w-2 rounded-full ${
                  appointment.status === "confirmed" ? "bg-sage" : "bg-clay"
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
                    : "bg-clay/10 text-clay"
                }`}
              >
                {appointment.status === "confirmed" ? "Reservada" : "Cancelada"}
              </span>
            </div>

            {appointment.status === "confirmed" ? (
              <div className="mt-3 flex justify-end gap-2">
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
