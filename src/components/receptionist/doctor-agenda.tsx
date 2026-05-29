"use client";

import { FormEvent, useMemo, useState } from "react";
import {
  ArrowLeft,
  BadgeCheck,
  CalendarCheck2,
  CalendarClock,
  CheckCircle2,
  Filter,
  GripVertical,
  Hourglass,
  LockKeyhole,
  Mail,
  Pencil,
  Phone,
  Plus,
  Search,
  Shuffle,
  Sparkles,
  UserRound,
  X,
  XCircle,
} from "lucide-react";
import Link from "next/link";

import { EmailLog } from "@/components/receptionist/email-log";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  availableTimes,
  demoDates,
  therapists,
  treatments,
} from "@/lib/receptionist/demo-data";
import type {
  Appointment,
  AppointmentStatus,
  AppointmentSlot,
  EmailEventType,
  EmailLogItem,
} from "@/lib/receptionist/types";

type AppointmentsPayload = {
  appointments: Appointment[];
};

type EmailPayload = {
  status: EmailLogItem["status"];
  recipient?: string;
  email?: {
    subject: string;
    body: string;
  };
  error?: string;
};

type StatusFilter = AppointmentStatus | "all";
type TherapistFilter = "all" | string;
type FreeSlot = Pick<AppointmentSlot, "date" | "time"> & {
  therapistId?: string;
};
type FreedSlot = Pick<AppointmentSlot, "date" | "time" | "therapistId"> & {
  sourceAppointmentId: string;
  sourcePatient: string;
};
type AppointmentFormValues = Omit<Appointment, "id" | "status">;

const statusOptions: Array<{ label: string; value: StatusFilter }> = [
  { label: "Todas", value: "all" },
  { label: "Pendientes", value: "pending" },
  { label: "Respuesta pendiente", value: "awaiting_response" },
  { label: "Confirmadas", value: "confirmed" },
  { label: "Paciente OK", value: "patient_confirmed" },
  { label: "Cambio propuesto", value: "reschedule_proposed" },
  { label: "No vino", value: "no_show" },
  { label: "Canceladas", value: "cancelled" },
  { label: "Bloqueos", value: "blocked" },
];

function sortAppointments(appointments: Appointment[]) {
  return [...appointments].sort((a, b) =>
    `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`),
  );
}

function formatAppointmentDate(date: string) {
  const value = new Date(`${date}T00:00:00`);

  if (Number.isNaN(value.getTime())) {
    return date;
  }

  return new Intl.DateTimeFormat("es-ES", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  }).format(value);
}

function countByStatus(appointments: Appointment[], status: AppointmentStatus) {
  return appointments.filter((appointment) => appointment.status === status)
    .length;
}

function resolveTreatment(id: string) {
  return treatments.find((treatment) => treatment.id === id)?.name ?? id;
}

function resolveTreatmentDuration(id: string) {
  return (
    treatments.find((treatment) => treatment.id === id)?.durationMinutes ?? 50
  );
}

function resolveTherapist(id: string) {
  return therapists.find((therapist) => therapist.id === id)?.name ?? id;
}

function formatStatus(status: Appointment["status"]) {
  return (
    statusOptions.find((option) => option.value === status)?.label ?? status
  );
}

function normalizeSearchText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

function getStatusTone(status: Appointment["status"]) {
  if (status === "pending") {
    return "border-clinical/30 bg-clinical/10 text-clinical";
  }

  if (status === "confirmed" || status === "patient_confirmed") {
    return "border-sage/30 bg-sage/10 text-sage";
  }

  if (
    status === "awaiting_response" ||
    status === "reschedule_proposed" ||
    status === "blocked"
  ) {
    return "border-amber-500/30 bg-amber-500/10 text-amber-700";
  }

  return "border-clay/30 bg-clay/10 text-clay";
}

function canDragAppointment(appointment: Appointment) {
  return !["blocked", "cancelled", "no_show"].includes(appointment.status);
}

function getAppointmentCardTone(status: Appointment["status"]) {
  if (status === "pending") {
    return "border-clinical/30 bg-clinical/10";
  }

  if (status === "confirmed" || status === "patient_confirmed") {
    return "border-sage/30 bg-sage/15";
  }

  if (
    status === "awaiting_response" ||
    status === "reschedule_proposed" ||
    status === "blocked"
  ) {
    return "border-amber-500/30 bg-amber-500/10";
  }

  return "border-clay/30 bg-clay/10 opacity-75";
}

function getStatusDotTone(status: Appointment["status"]) {
  if (status === "pending") {
    return "bg-clinical";
  }

  if (status === "confirmed" || status === "patient_confirmed") {
    return "bg-sage";
  }

  if (
    status === "awaiting_response" ||
    status === "reschedule_proposed" ||
    status === "blocked"
  ) {
    return "bg-amber-500";
  }

  return "bg-clay";
}

export function getResponsePendingToggleStatus(status: AppointmentStatus) {
  return status === "awaiting_response" ? "confirmed" : "awaiting_response";
}

export function didAppointmentFreeSlot(
  previous: Pick<Appointment, "date" | "time" | "therapistId">,
  next: Pick<Appointment, "date" | "time" | "therapistId">,
) {
  return (
    previous.date !== next.date ||
    previous.time !== next.time ||
    previous.therapistId !== next.therapistId
  );
}

function AppointmentBadges({ appointment }: { appointment: Appointment }) {
  return (
    <div className="mt-2 flex flex-wrap items-center gap-1.5">
      {appointment.status === "patient_confirmed" ? (
        <span className="border-sage/25 bg-sage/10 text-sage inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium">
          <BadgeCheck className="size-3" aria-hidden="true" />
          Paciente OK
        </span>
      ) : null}
      {appointment.status === "awaiting_response" ||
      appointment.status === "reschedule_proposed" ? (
        <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/25 bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-700">
          <Hourglass className="size-3" aria-hidden="true" />
          Respuesta
        </span>
      ) : null}
      {appointment.status === "blocked" ? (
        <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/25 bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-700">
          <XCircle className="size-3" aria-hidden="true" />
          Bloqueo
        </span>
      ) : null}
      {appointment.wantsEarlier ? (
        <span className="border-clinical/25 bg-clinical/10 text-clinical inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium">
          <Sparkles className="size-3" aria-hidden="true" />
          Antes
        </span>
      ) : null}
      {canDragAppointment(appointment) ? (
        <span
          className="text-muted-foreground border-border/60 bg-background/50 hidden items-center rounded-full border px-1.5 py-0.5 md:inline-flex"
          title="Arrastrar para cambiar de hueco"
        >
          <GripVertical className="size-3" aria-hidden="true" />
          <span className="sr-only">Arrastrar para cambiar de hueco</span>
        </span>
      ) : null}
    </div>
  );
}

function isAfterSlot(appointment: Appointment, slot: FreedSlot) {
  return (
    `${appointment.date} ${appointment.time}` > `${slot.date} ${slot.time}`
  );
}

function AppointmentDetailModal({
  appointment,
  loading,
  onCancel,
  onClose,
  onConfirm,
  onEdit,
  onSendReminder,
  onStatusChange,
  statusMessage,
}: {
  appointment: Appointment;
  loading: boolean;
  onCancel: (appointment: Appointment) => void;
  onClose: () => void;
  onConfirm: (appointment: Appointment) => void;
  onEdit: (appointment: Appointment) => void;
  onSendReminder: (appointment: Appointment) => void;
  onStatusChange: (appointment: Appointment, status: AppointmentStatus) => void;
  statusMessage: string;
}) {
  const isBlock = appointment.status === "blocked";

  return (
    <div
      className="modal-backdrop bg-charcoal/70 fixed inset-0 z-50 flex items-end justify-center px-3 py-3 backdrop-blur-sm sm:items-center sm:px-4 sm:py-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="appointment-detail-title"
    >
      <article className="modal-panel glass shadow-elegant border-border/60 relative max-h-[calc(100dvh-1.5rem)] w-full max-w-3xl overflow-y-auto rounded-2xl border">
        <button
          type="button"
          className="text-muted-foreground hover:text-foreground hover:bg-background/70 absolute top-4 right-4 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full transition-colors"
          onClick={onClose}
        >
          <X className="size-5" aria-hidden="true" />
          <span className="sr-only">Cerrar ficha de cita</span>
        </button>

        <header className="border-border/60 bg-background/85 border-b px-5 py-5 pr-16 sm:px-7">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "rounded-full border px-2.5 py-1 text-xs font-medium",
                getStatusTone(appointment.status),
              )}
            >
              {formatStatus(appointment.status)}
            </span>
            <span className="text-muted-foreground text-xs tabular-nums">
              {formatAppointmentDate(appointment.date)} · {appointment.time}
            </span>
          </div>
          <h2
            id="appointment-detail-title"
            className="font-display mt-3 text-2xl leading-tight sm:text-3xl"
          >
            {appointment.patientName}
          </h2>
          <p className="text-muted-foreground mt-2 text-sm">
            {resolveTreatment(appointment.treatmentId)} con{" "}
            {resolveTherapist(appointment.therapistId)}
          </p>
          <p className="text-muted-foreground mt-1 text-sm">
            Tiempo de sesion:{" "}
            {resolveTreatmentDuration(appointment.treatmentId)} min
            {appointment.wantsEarlier ? " · quiere venir antes" : ""}
          </p>
        </header>

        <div className="grid gap-5 px-5 py-5 sm:px-7 lg:grid-cols-[1fr_0.85fr]">
          <section className="border-border/60 bg-background/65 rounded-xl border p-4">
            <h3 className="text-sm font-semibold">Ficha del paciente</h3>
            <div className="mt-4 grid gap-3 text-sm">
              <p className="text-muted-foreground flex items-center gap-2">
                <UserRound className="size-4" aria-hidden="true" />
                {appointment.patientName}
              </p>
              <p className="text-muted-foreground flex min-w-0 items-center gap-2">
                <Mail className="size-4 shrink-0" aria-hidden="true" />
                <span className="truncate">{appointment.patientEmail}</span>
              </p>
              <p className="text-muted-foreground flex items-center gap-2">
                <Phone className="size-4" aria-hidden="true" />
                {appointment.patientPhone}
              </p>
            </div>
            {appointment.notes ? (
              <p className="text-muted-foreground mt-4 text-sm leading-relaxed">
                {appointment.notes}
              </p>
            ) : null}
          </section>

          <section className="border-border/60 bg-background/65 rounded-xl border p-4">
            <h3 className="text-sm font-semibold">Acciones</h3>
            {statusMessage ? (
              <p
                className="border-sage/25 bg-sage/10 text-sage mt-3 rounded-lg border px-3 py-2 text-sm font-medium"
                role="status"
              >
                {statusMessage}
              </p>
            ) : null}
            <div className="mt-4 flex flex-col gap-2">
              {appointment.status === "pending" ? (
                <Button
                  type="button"
                  disabled={loading}
                  onClick={() => onConfirm(appointment)}
                >
                  <CheckCircle2 className="size-4" aria-hidden="true" />
                  Confirmar cita
                </Button>
              ) : null}
              {appointment.status !== "cancelled" &&
              appointment.status !== "no_show" ? (
                <>
                  {!isBlock ? (
                    <>
                      <Button
                        type="button"
                        disabled={loading}
                        onClick={() => onEdit(appointment)}
                      >
                        <Pencil className="size-4" aria-hidden="true" />
                        Modificar cita
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        disabled={loading}
                        onClick={() => onSendReminder(appointment)}
                      >
                        <Mail className="size-4" aria-hidden="true" />
                        Enviar recordatorio
                      </Button>
                      <Button
                        type="button"
                        variant={
                          appointment.status === "awaiting_response"
                            ? "default"
                            : "ghost"
                        }
                        disabled={loading}
                        onClick={() =>
                          onStatusChange(
                            appointment,
                            getResponsePendingToggleStatus(appointment.status),
                          )
                        }
                      >
                        {appointment.status === "awaiting_response"
                          ? "Marcar respondida"
                          : "Respuesta pendiente"}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        disabled={loading}
                        onClick={() => onStatusChange(appointment, "no_show")}
                      >
                        No se presento
                      </Button>
                    </>
                  ) : null}
                  <Button
                    type="button"
                    variant="ghost"
                    disabled={loading}
                    onClick={() => onCancel(appointment)}
                  >
                    <XCircle className="size-4" aria-hidden="true" />
                    {isBlock ? "Liberar bloqueo" : "Cancelar cita"}
                  </Button>
                </>
              ) : (
                <p className="text-muted-foreground text-sm">
                  Esta cita queda como histórico cancelado.
                </p>
              )}
            </div>
          </section>
        </div>
      </article>
    </div>
  );
}

function AppointmentEditModal({
  appointment,
  loading,
  onClose,
  onSave,
}: {
  appointment: Appointment;
  loading: boolean;
  onClose: () => void;
  onSave: (
    appointment: Appointment,
    changes: Pick<
      Appointment,
      "date" | "time" | "therapistId" | "treatmentId" | "notes" | "wantsEarlier"
    >,
  ) => void;
}) {
  const [date, setDate] = useState(appointment.date);
  const [time, setTime] = useState(appointment.time);
  const [therapistId, setTherapistId] = useState(appointment.therapistId);
  const [treatmentId, setTreatmentId] = useState(appointment.treatmentId);
  const [notes, setNotes] = useState(appointment.notes ?? "");
  const [wantsEarlier, setWantsEarlier] = useState(
    appointment.wantsEarlier ?? false,
  );

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSave(appointment, {
      date,
      time,
      therapistId,
      treatmentId,
      notes: notes.trim(),
      wantsEarlier,
    });
  }

  return (
    <div
      className="modal-backdrop bg-charcoal/70 fixed inset-0 z-50 flex items-end justify-center px-3 py-3 backdrop-blur-sm sm:items-center sm:px-4 sm:py-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="appointment-edit-title"
    >
      <article className="modal-panel glass shadow-elegant border-border/60 relative max-h-[calc(100dvh-1.5rem)] w-full max-w-2xl overflow-y-auto rounded-2xl border">
        <button
          type="button"
          className="text-muted-foreground hover:text-foreground hover:bg-background/70 absolute top-4 right-4 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full transition-colors"
          onClick={onClose}
        >
          <X className="size-5" aria-hidden="true" />
          <span className="sr-only">Cerrar modificacion de cita</span>
        </button>

        <header className="border-border/60 bg-background/85 border-b px-5 py-5 pr-16 sm:px-7">
          <span className="text-sage text-xs font-medium tracking-[0.16em] uppercase">
            Modificar cita
          </span>
          <h2
            id="appointment-edit-title"
            className="font-display mt-3 text-2xl leading-tight sm:text-3xl"
          >
            {appointment.patientName}
          </h2>
          <p className="text-muted-foreground mt-2 text-sm">
            Al guardar, se envia un email al paciente con el nuevo horario.
          </p>
        </header>

        <form className="grid gap-4 px-5 py-5 sm:px-7" onSubmit={handleSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2 text-sm font-medium">
              Dia
              <select
                className="border-input bg-background focus:ring-ring/40 h-11 rounded-md border px-3 text-base outline-none focus:ring-2 sm:text-sm"
                value={date}
                onChange={(event) => setDate(event.target.value)}
              >
                {demoDates.map((day) => (
                  <option key={day} value={day}>
                    {formatAppointmentDate(day)}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-2 text-sm font-medium">
              Hora
              <select
                className="border-input bg-background focus:ring-ring/40 h-11 rounded-md border px-3 text-base outline-none focus:ring-2 sm:text-sm"
                value={time}
                onChange={(event) => setTime(event.target.value)}
              >
                {availableTimes.map((availableTime) => (
                  <option key={availableTime} value={availableTime}>
                    {availableTime}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-2 text-sm font-medium">
              Profesional
              <select
                className="border-input bg-background focus:ring-ring/40 h-11 rounded-md border px-3 text-base outline-none focus:ring-2 sm:text-sm"
                value={therapistId}
                onChange={(event) => setTherapistId(event.target.value)}
              >
                {therapists.map((therapist) => (
                  <option key={therapist.id} value={therapist.id}>
                    {therapist.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-2 text-sm font-medium">
              Tratamiento
              <select
                className="border-input bg-background focus:ring-ring/40 h-11 rounded-md border px-3 text-base outline-none focus:ring-2 sm:text-sm"
                value={treatmentId}
                onChange={(event) => setTreatmentId(event.target.value)}
              >
                {treatments.map((treatment) => (
                  <option key={treatment.id} value={treatment.id}>
                    {treatment.name}
                  </option>
                ))}
              </select>
              <span className="text-muted-foreground text-xs">
                Tiempo de sesion: {resolveTreatmentDuration(treatmentId)} min
              </span>
            </label>
          </div>

          <label className="border-border/60 bg-background/55 flex items-start gap-3 rounded-lg border px-4 py-3 text-sm">
            <input
              type="checkbox"
              className="border-input text-primary focus:ring-ring/40 mt-0.5 size-4 rounded"
              checked={wantsEarlier}
              onChange={(event) => setWantsEarlier(event.target.checked)}
            />
            <span>
              <span className="block font-medium">Quiere venir antes</span>
              <span className="text-muted-foreground">
                Si se libera un hueco, aparecera en la lista de espera.
              </span>
            </span>
          </label>

          <label className="grid gap-2 text-sm font-medium">
            Notas internas
            <textarea
              className="border-input bg-background focus:ring-ring/40 min-h-20 rounded-md border px-3 py-3 text-base outline-none focus:ring-2 sm:min-h-28 sm:text-sm"
              value={notes}
              maxLength={500}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Ej: pendiente de pagar, prefiere tardes, llamar antes de confirmar."
            />
          </label>

          <div className="border-border/60 bg-background/55 rounded-lg border px-4 py-3 text-sm leading-relaxed">
            El paciente recibira un email con la cita modificada y el telefono
            de la clinica por si el cambio no le encaja.
          </div>

          <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="ghost"
              disabled={loading}
              onClick={onClose}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Guardando..." : "Guardar y avisar"}
            </Button>
          </div>
        </form>
      </article>
    </div>
  );
}

function FreeSlotModal({
  loading,
  slot,
  onClose,
  onCreate,
  onCreateBlock,
}: {
  loading: boolean;
  slot: FreeSlot;
  onClose: () => void;
  onCreate: (values: AppointmentFormValues) => void;
  onCreateBlock: (
    slot: Pick<Appointment, "date" | "time" | "therapistId" | "notes">,
  ) => void;
}) {
  const [patientName, setPatientName] = useState("");
  const [patientEmail, setPatientEmail] = useState("");
  const [patientPhone, setPatientPhone] = useState("");
  const [date, setDate] = useState(slot.date);
  const [time, setTime] = useState(slot.time);
  const [therapistId, setTherapistId] = useState(
    slot.therapistId ?? therapists[0]?.id ?? "marta",
  );
  const [treatmentId, setTreatmentId] = useState(
    treatments[0]?.id ?? "general",
  );
  const [notes, setNotes] = useState("");
  const [wantsEarlier, setWantsEarlier] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onCreate({
      patientName: patientName.trim(),
      patientEmail: patientEmail.trim(),
      patientPhone: patientPhone.trim(),
      date,
      time,
      therapistId,
      treatmentId,
      notes: notes.trim() || "Cita creada manualmente desde el panel.",
      wantsEarlier,
    });
  }

  return (
    <div
      className="modal-backdrop bg-charcoal/70 fixed inset-0 z-50 flex items-end justify-center px-3 py-3 backdrop-blur-sm sm:items-center sm:px-4 sm:py-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="free-slot-title"
    >
      <article className="modal-panel glass shadow-elegant border-border/60 relative max-h-[calc(100dvh-1.5rem)] w-full max-w-2xl overflow-y-auto rounded-2xl border">
        <button
          type="button"
          className="text-muted-foreground hover:text-foreground hover:bg-background/70 absolute top-4 right-4 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full transition-colors"
          onClick={onClose}
        >
          <X className="size-5" aria-hidden="true" />
          <span className="sr-only">Cerrar nueva cita manual</span>
        </button>

        <header className="border-border/60 bg-background/85 border-b px-5 py-5 pr-16 sm:px-7">
          <span className="text-sage text-xs font-medium tracking-[0.16em] uppercase">
            Nueva cita manual
          </span>
          <h2
            id="free-slot-title"
            className="font-display mt-3 text-2xl leading-tight sm:text-3xl"
          >
            {formatAppointmentDate(date)} · {time}
          </h2>
          <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
            Crea una cita desde recepcion sin depender de la IA. Al guardar se
            envia el email de confirmacion al paciente.
          </p>
        </header>

        <form className="grid gap-4 px-5 py-5 sm:px-7" onSubmit={handleSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2 text-sm font-medium">
              Paciente
              <input
                required
                className="border-input bg-background focus:ring-ring/40 h-11 rounded-md border px-3 text-base outline-none focus:ring-2 sm:text-sm"
                value={patientName}
                onChange={(event) => setPatientName(event.target.value)}
                placeholder="Nombre y apellidos"
              />
            </label>

            <label className="grid gap-2 text-sm font-medium">
              Email
              <input
                required
                type="email"
                className="border-input bg-background focus:ring-ring/40 h-11 rounded-md border px-3 text-base outline-none focus:ring-2 sm:text-sm"
                value={patientEmail}
                onChange={(event) => setPatientEmail(event.target.value)}
                placeholder="paciente@email.com"
              />
            </label>

            <label className="grid gap-2 text-sm font-medium">
              Telefono
              <input
                required
                className="border-input bg-background focus:ring-ring/40 h-11 rounded-md border px-3 text-base outline-none focus:ring-2 sm:text-sm"
                value={patientPhone}
                onChange={(event) => setPatientPhone(event.target.value)}
                placeholder="600 000 000"
              />
            </label>

            <label className="grid gap-2 text-sm font-medium">
              Profesional
              <select
                className="border-input bg-background focus:ring-ring/40 h-11 rounded-md border px-3 text-base outline-none focus:ring-2 sm:text-sm"
                value={therapistId}
                onChange={(event) => setTherapistId(event.target.value)}
              >
                {therapists.map((therapist) => (
                  <option key={therapist.id} value={therapist.id}>
                    {therapist.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-2 text-sm font-medium">
              Dia
              <select
                className="border-input bg-background focus:ring-ring/40 h-11 rounded-md border px-3 text-base outline-none focus:ring-2 sm:text-sm"
                value={date}
                onChange={(event) => setDate(event.target.value)}
              >
                {demoDates.map((day) => (
                  <option key={day} value={day}>
                    {formatAppointmentDate(day)}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-2 text-sm font-medium">
              Hora
              <select
                className="border-input bg-background focus:ring-ring/40 h-11 rounded-md border px-3 text-base outline-none focus:ring-2 sm:text-sm"
                value={time}
                onChange={(event) => setTime(event.target.value)}
              >
                {availableTimes.map((availableTime) => (
                  <option key={availableTime} value={availableTime}>
                    {availableTime}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-2 text-sm font-medium sm:col-span-2">
              Tratamiento
              <select
                className="border-input bg-background focus:ring-ring/40 h-11 rounded-md border px-3 text-base outline-none focus:ring-2 sm:text-sm"
                value={treatmentId}
                onChange={(event) => setTreatmentId(event.target.value)}
              >
                {treatments.map((treatment) => (
                  <option key={treatment.id} value={treatment.id}>
                    {treatment.name} · {treatment.durationMinutes} min ·{" "}
                    {treatment.price} €
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="border-border/60 bg-background/55 flex items-start gap-3 rounded-lg border px-4 py-3 text-sm">
            <input
              type="checkbox"
              className="border-input text-primary focus:ring-ring/40 mt-0.5 size-4 rounded"
              checked={wantsEarlier}
              onChange={(event) => setWantsEarlier(event.target.checked)}
            />
            <span>
              <span className="block font-medium">Marcar lista de espera</span>
              <span className="text-muted-foreground">
                El paciente aparecera para recolocarlo si se libera un hueco
                anterior.
              </span>
            </span>
          </label>

          <label className="grid gap-2 text-sm font-medium">
            Notas internas
            <textarea
              className="border-input bg-background focus:ring-ring/40 min-h-20 rounded-md border px-3 py-3 text-base outline-none focus:ring-2 sm:text-sm"
              value={notes}
              maxLength={500}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Ej: pendiente de pagar, prefiere tardes, viene por dolor lumbar."
            />
          </label>

          <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="ghost"
              disabled={loading}
              onClick={onClose}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="ghost"
              disabled={loading}
              onClick={() =>
                onCreateBlock({
                  date,
                  time,
                  therapistId,
                  notes: notes.trim() || "Bloqueo manual",
                })
              }
            >
              Bloquear hueco
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creando..." : "Crear y enviar email"}
            </Button>
          </div>
        </form>
      </article>
    </div>
  );
}

function AppointmentCalendar({
  appointments,
  selectedDay,
  selectedTherapist,
  onMoveToSlot,
  onSelectAppointment,
  onSelectSlot,
}: {
  appointments: Appointment[];
  selectedDay: string;
  selectedTherapist: TherapistFilter;
  onMoveToSlot: (appointment: Appointment, slot: FreeSlot) => void;
  onSelectAppointment: (appointment: Appointment) => void;
  onSelectSlot: (slot: FreeSlot) => void;
}) {
  const days = selectedDay === "all" ? demoDates : [selectedDay];
  const appointmentsBySlot = useMemo(() => {
    const grouped = new Map<string, Appointment[]>();

    for (const appointment of appointments) {
      const key = `${appointment.date}-${appointment.time}`;
      grouped.set(key, [...(grouped.get(key) ?? []), appointment]);
    }

    return grouped;
  }, [appointments]);

  return (
    <section className="glass shadow-elegant border-border/60 overflow-hidden rounded-xl border">
      <header className="border-border/60 flex flex-col gap-2 border-b px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-muted-foreground inline-flex items-center gap-2 text-xs font-medium tracking-[0.16em] uppercase">
            <CalendarCheck2 className="size-4" aria-hidden="true" />
            Calendario semanal
          </div>
          <h2 className="font-display mt-2 text-3xl leading-tight">
            Agenda semanal
          </h2>
        </div>
        <p className="text-muted-foreground text-sm">
          Horas bloqueadas, pacientes y profesional asignado.
        </p>
      </header>

      <div className="grid gap-3 px-4 py-4 md:hidden">
        {days.map((day) => (
          <article
            key={day}
            className="border-border/60 bg-background/45 overflow-hidden rounded-xl border"
          >
            <header className="border-border/60 bg-background/70 border-b px-4 py-3">
              <p className="font-display text-xl capitalize">
                {formatAppointmentDate(day)}
              </p>
              <p className="text-muted-foreground mt-1 text-xs tabular-nums">
                {day}
              </p>
            </header>
            <div className="divide-border/50 divide-y">
              {availableTimes.map((time) => {
                const slotAppointments =
                  appointmentsBySlot.get(`${day}-${time}`) ?? [];

                return (
                  <div
                    key={`${day}-${time}`}
                    className="grid grid-cols-[4.25rem_1fr] gap-3 px-4 py-3"
                  >
                    <span className="text-muted-foreground pt-2 text-sm font-medium tabular-nums">
                      {time}
                    </span>
                    {slotAppointments.length > 0 ? (
                      <div className="space-y-2">
                        {slotAppointments.map((appointment) => (
                          <button
                            key={appointment.id}
                            type="button"
                            className={cn(
                              "focus:ring-ring/40 w-full cursor-pointer rounded-lg border px-3 py-3 text-left text-sm shadow-sm transition-all focus:ring-2 focus:outline-none",
                              getAppointmentCardTone(appointment.status),
                            )}
                            onClick={() => onSelectAppointment(appointment)}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <p className="leading-snug font-medium">
                                {appointment.patientName}
                              </p>
                              <span
                                className={cn(
                                  "mt-1 h-2.5 w-2.5 shrink-0 rounded-full",
                                  getStatusDotTone(appointment.status),
                                )}
                              />
                            </div>
                            <p className="text-muted-foreground mt-1 leading-snug">
                              {resolveTreatment(appointment.treatmentId)} ·{" "}
                              {resolveTreatmentDuration(
                                appointment.treatmentId,
                              )}{" "}
                              min
                            </p>
                            <p className="text-muted-foreground mt-1 leading-snug">
                              {resolveTherapist(appointment.therapistId)}
                            </p>
                            <AppointmentBadges appointment={appointment} />
                          </button>
                        ))}
                      </div>
                    ) : (
                      <button
                        type="button"
                        className="border-border/50 text-muted-foreground hover:border-sage/40 hover:bg-sage/10 hover:text-foreground min-h-12 w-full rounded-lg border border-dashed px-3 py-3 text-sm transition-colors"
                        onClick={() =>
                          onSelectSlot({
                            date: day,
                            time,
                            therapistId:
                              selectedTherapist === "all"
                                ? undefined
                                : selectedTherapist,
                          })
                        }
                      >
                        Libre
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </article>
        ))}
      </div>

      <div className="hidden overflow-x-auto md:block">
        <div className="min-w-[920px]">
          <div
            className="border-border/60 grid border-b"
            style={{
              gridTemplateColumns: `88px repeat(${days.length}, minmax(160px, 1fr))`,
            }}
          >
            <div className="bg-background/70 border-border/60 text-muted-foreground border-r px-4 py-3 text-xs font-medium tracking-[0.14em] uppercase">
              Hora
            </div>
            {days.map((day) => (
              <div
                key={day}
                className="bg-background/70 border-border/60 border-r px-4 py-3 last:border-r-0"
              >
                <p className="font-display text-xl capitalize">
                  {formatAppointmentDate(day)}
                </p>
                <p className="text-muted-foreground mt-1 text-xs tabular-nums">
                  {day}
                </p>
              </div>
            ))}
          </div>

          {availableTimes.map((time) => (
            <div
              key={time}
              className="border-border/50 grid min-h-32 border-b last:border-b-0"
              style={{
                gridTemplateColumns: `88px repeat(${days.length}, minmax(160px, 1fr))`,
              }}
            >
              <div className="bg-background/45 border-border/60 text-muted-foreground border-r px-4 py-4 text-sm font-medium tabular-nums">
                {time}
              </div>
              {days.map((day) => {
                const slotAppointments =
                  appointmentsBySlot.get(`${day}-${time}`) ?? [];

                return (
                  <div
                    key={`${day}-${time}`}
                    className="border-border/50 bg-background/25 min-h-32 border-r p-2 last:border-r-0"
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={(event) => {
                      event.preventDefault();
                      const appointmentId =
                        event.dataTransfer.getData("text/plain");
                      const appointment = appointments.find(
                        (item) => item.id === appointmentId,
                      );

                      if (appointment) {
                        onMoveToSlot(appointment, { date: day, time });
                      }
                    }}
                  >
                    {slotAppointments.length > 0 ? (
                      <div className="space-y-2">
                        {slotAppointments.map((appointment) => (
                          <button
                            key={appointment.id}
                            type="button"
                            draggable={canDragAppointment(appointment)}
                            className={cn(
                              "focus:ring-ring/40 w-full rounded-md border px-3 py-2 text-left text-xs shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md focus:ring-2 focus:outline-none",
                              canDragAppointment(appointment)
                                ? "cursor-grab active:cursor-grabbing"
                                : "cursor-pointer",
                              getAppointmentCardTone(appointment.status),
                            )}
                            onClick={() => onSelectAppointment(appointment)}
                            onDragStart={(event) => {
                              if (!canDragAppointment(appointment)) {
                                event.preventDefault();
                                return;
                              }

                              event.dataTransfer.setData(
                                "text/plain",
                                appointment.id,
                              );
                              event.dataTransfer.effectAllowed = "move";
                            }}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <p className="leading-snug font-medium">
                                {appointment.patientName}
                              </p>
                              <span
                                className={cn(
                                  "mt-0.5 h-2 w-2 shrink-0 rounded-full",
                                  getStatusDotTone(appointment.status),
                                )}
                              />
                            </div>
                            <p className="text-muted-foreground mt-1 truncate">
                              {resolveTreatment(appointment.treatmentId)} ·{" "}
                              {resolveTreatmentDuration(
                                appointment.treatmentId,
                              )}{" "}
                              min
                            </p>
                            <p className="text-muted-foreground mt-1 truncate">
                              {resolveTherapist(appointment.therapistId)}
                            </p>
                            <AppointmentBadges appointment={appointment} />
                          </button>
                        ))}
                      </div>
                    ) : (
                      <button
                        type="button"
                        className="border-border/50 text-muted-foreground/70 hover:border-sage/40 hover:bg-sage/10 hover:text-foreground flex h-full min-h-28 w-full items-center justify-center rounded-md border border-dashed text-xs transition-colors"
                        onClick={() =>
                          onSelectSlot({
                            date: day,
                            time,
                            therapistId:
                              selectedTherapist === "all"
                                ? undefined
                                : selectedTherapist,
                          })
                        }
                      >
                        Libre
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FreedSlotPanel({
  candidates,
  loading,
  slot,
  onDismiss,
  onMoveCandidate,
}: {
  candidates: Appointment[];
  loading: boolean;
  slot: FreedSlot;
  onDismiss: () => void;
  onMoveCandidate: (appointment: Appointment, slot: FreedSlot) => void;
}) {
  return (
    <section className="glass shadow-elegant border-sage/25 bg-sage/10 overflow-hidden rounded-xl border">
      <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="text-sage inline-flex items-center gap-2 text-xs font-medium tracking-[0.16em] uppercase">
            <Shuffle className="size-4" aria-hidden="true" />
            Hueco liberado
          </div>
          <h2 className="font-display mt-2 text-2xl leading-tight">
            {formatAppointmentDate(slot.date)} · {slot.time}
          </h2>
          <p className="text-muted-foreground mt-2 text-sm">
            Se ha liberado al mover o cancelar la cita de {slot.sourcePatient}.
          </p>
        </div>
        <Button type="button" variant="ghost" onClick={onDismiss}>
          Cerrar
        </Button>
      </div>

      <div className="border-border/60 border-t px-5 py-4">
        {candidates.length > 0 ? (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {candidates.map((candidate) => (
              <article
                key={candidate.id}
                className="border-border/60 bg-background/70 rounded-lg border p-4"
              >
                <p className="font-medium">{candidate.patientName}</p>
                <p className="text-muted-foreground mt-1 text-sm">
                  Ahora: {formatAppointmentDate(candidate.date)} ·{" "}
                  {candidate.time}
                </p>
                <p className="text-muted-foreground mt-1 text-sm">
                  {resolveTreatment(candidate.treatmentId)} ·{" "}
                  {resolveTherapist(candidate.therapistId)}
                </p>
                <Button
                  type="button"
                  className="mt-4 w-full"
                  disabled={loading}
                  onClick={() => onMoveCandidate(candidate, slot)}
                >
                  Recolocar y avisar
                </Button>
              </article>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">
            No hay pacientes de este profesional marcados para adelantar.
          </p>
        )}
      </div>
    </section>
  );
}

async function sendEmail(
  type: EmailEventType,
  appointment: Appointment,
  pin: string,
) {
  const response = await fetch("/api/email", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-doctor-pin": pin },
    body: JSON.stringify({ type, appointment }),
  });
  const payload = (await response
    .json()
    .catch(() => null)) as EmailPayload | null;

  return {
    id: `${type}-${appointment.id}-${Date.now()}`,
    type,
    recipient: payload?.recipient ?? appointment.patientEmail,
    subject: payload?.email?.subject ?? "Email de cita",
    body: payload?.email?.body ?? payload?.error ?? "",
    status: payload?.status ?? "failed",
    createdAt: new Date().toISOString(),
  } satisfies EmailLogItem;
}

export function DoctorAgenda() {
  const [pin, setPin] = useState("");
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [authorized, setAuthorized] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [dayFilter, setDayFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [therapistFilter, setTherapistFilter] =
    useState<TherapistFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAppointment, setSelectedAppointment] =
    useState<Appointment | null>(null);
  const [editingAppointment, setEditingAppointment] =
    useState<Appointment | null>(null);
  const [emails, setEmails] = useState<EmailLogItem[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<FreeSlot | null>(null);
  const [freedSlot, setFreedSlot] = useState<FreedSlot | null>(null);
  const [actionMessage, setActionMessage] = useState("");

  function addEmailLog(email: EmailLogItem) {
    setEmails((current) => [email, ...current].slice(0, 8));

    if (email.status === "failed") {
      setError(
        "La cita se actualizó, pero Resend no ha enviado el email. Revisa el remitente o el dominio.",
      );
    }
  }

  const confirmedCount = useMemo(
    () =>
      countByStatus(appointments, "confirmed") +
      countByStatus(appointments, "patient_confirmed"),
    [appointments],
  );
  const pendingCount = useMemo(
    () => countByStatus(appointments, "pending"),
    [appointments],
  );
  const cancelledCount = useMemo(
    () => countByStatus(appointments, "cancelled"),
    [appointments],
  );
  const waitingCount = useMemo(
    () =>
      countByStatus(appointments, "awaiting_response") +
      countByStatus(appointments, "reschedule_proposed"),
    [appointments],
  );
  const waitlistCount = useMemo(
    () =>
      appointments.filter(
        (appointment) =>
          appointment.wantsEarlier && appointment.status !== "cancelled",
      ).length,
    [appointments],
  );
  const blockCount = useMemo(
    () => countByStatus(appointments, "blocked"),
    [appointments],
  );
  const estimatedMinutesSaved = useMemo(
    () => Math.max(appointments.length - blockCount, 0) * 4 + emails.length * 2,
    [appointments.length, blockCount, emails.length],
  );
  const agendaDays = useMemo(
    () =>
      Array.from(new Set(appointments.map((appointment) => appointment.date))),
    [appointments],
  );
  const filteredAppointments = useMemo(() => {
    const normalizedQuery = normalizeSearchText(searchQuery.trim());

    return appointments.filter((appointment) => {
      const matchesDay = dayFilter === "all" || appointment.date === dayFilter;
      const matchesStatus =
        statusFilter === "all" || appointment.status === statusFilter;
      const matchesTherapist =
        therapistFilter === "all" ||
        appointment.therapistId === therapistFilter;
      const searchableText = normalizeSearchText(
        [
          appointment.patientName,
          appointment.patientEmail,
          appointment.patientPhone,
          appointment.notes ?? "",
          resolveTreatment(appointment.treatmentId),
          resolveTherapist(appointment.therapistId),
          formatStatus(appointment.status),
        ].join(" "),
      );
      const matchesSearch =
        !normalizedQuery || searchableText.includes(normalizedQuery);

      return matchesDay && matchesStatus && matchesTherapist && matchesSearch;
    });
  }, [appointments, dayFilter, searchQuery, statusFilter, therapistFilter]);
  const waitlistCandidates = useMemo(() => {
    if (!freedSlot) {
      return [];
    }

    return appointments.filter(
      (appointment) =>
        appointment.status !== "cancelled" &&
        appointment.wantsEarlier &&
        appointment.therapistId === freedSlot.therapistId &&
        appointment.id !== freedSlot.sourceAppointmentId &&
        isAfterSlot(appointment, freedSlot),
    );
  }, [appointments, freedSlot]);
  const nextAppointment = useMemo(
    () =>
      appointments.find(
        (appointment) =>
          appointment.status === "confirmed" ||
          appointment.status === "patient_confirmed",
      ) ?? null,
    [appointments],
  );

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
    const nextAppointments = sortAppointments(payload.appointments);
    setAppointments(nextAppointments);
    setDayFilter((currentDay) =>
      currentDay === "all" ||
      nextAppointments.some((appointment) => appointment.date === currentDay)
        ? currentDay
        : "all",
    );
    setLoading(false);

    return payload.appointments;
  }

  function markFreedSlot(appointment: Appointment) {
    setFreedSlot({
      date: appointment.date,
      time: appointment.time,
      therapistId: appointment.therapistId,
      sourceAppointmentId: appointment.id,
      sourcePatient: appointment.patientName,
    });
  }

  async function handleCancel(appointment: Appointment) {
    const updated = await patchAgenda({
      action: "cancel",
      appointmentId: appointment.id,
    });
    const cancelled = updated?.find((item) => item.id === appointment.id);

    if (cancelled) {
      setSelectedAppointment(null);
      markFreedSlot(appointment);
      setActionMessage(
        appointment.status === "blocked"
          ? "Bloqueo liberado. El hueco vuelve a estar disponible."
          : "Cita cancelada. El hueco queda libre para recolocar pacientes.",
      );
    }

    if (appointment.status !== "blocked") {
      addEmailLog(
        await sendEmail(
          "cancellation",
          { ...appointment, status: "cancelled" },
          pin,
        ),
      );
    }
  }

  async function handleConfirm(appointment: Appointment) {
    const updated = await patchAgenda({
      action: "confirm",
      appointmentId: appointment.id,
    });
    const confirmed = updated?.find((item) => item.id === appointment.id);

    if (confirmed) {
      setSelectedAppointment(confirmed);
      setActionMessage("Cita confirmada. Se ha enviado el email al paciente.");
      addEmailLog(await sendEmail("confirmation", confirmed, pin));
    }
  }

  async function handleMoveToSlot(appointment: Appointment, slot: FreeSlot) {
    if (appointment.status === "cancelled") {
      return;
    }

    const updated = await patchAgenda({
      action: "move",
      appointmentId: appointment.id,
      slot: {
        date: slot.date,
        time: slot.time,
        therapistId: appointment.therapistId,
        treatmentId: appointment.treatmentId,
      },
    });
    const moved = updated?.find((item) => item.id === appointment.id);

    if (moved) {
      setSelectedAppointment(null);
      markFreedSlot(appointment);
      setActionMessage("Cita movida. El paciente recibira el aviso por email.");
      addEmailLog(await sendEmail("modification", moved, pin));
    }
  }

  async function handleEditAppointment(
    appointment: Appointment,
    changes: Pick<
      Appointment,
      "date" | "time" | "therapistId" | "treatmentId" | "notes" | "wantsEarlier"
    >,
  ) {
    const updated = await patchAgenda({
      action: "move",
      appointmentId: appointment.id,
      slot: changes,
    });
    const moved = updated?.find((item) => item.id === appointment.id);

    if (moved) {
      setEditingAppointment(null);
      if (didAppointmentFreeSlot(appointment, moved)) {
        setSelectedAppointment(null);
        markFreedSlot(appointment);
      } else {
        setSelectedAppointment(moved);
      }
      setActionMessage("Cambios guardados y email preparado para el paciente.");
      addEmailLog(await sendEmail("modification", moved, pin));
    }
  }

  async function handleCreateAppointment(values: AppointmentFormValues) {
    const updated = await patchAgenda({
      action: "create_manual",
      appointment: values,
    });
    const created = updated?.find(
      (appointment) =>
        appointment.patientEmail === values.patientEmail &&
        appointment.date === values.date &&
        appointment.time === values.time &&
        appointment.therapistId === values.therapistId,
    );

    if (created) {
      setSelectedSlot(null);
      setSelectedAppointment(created);
      setActionMessage("Cita creada manualmente y confirmacion enviada.");
      addEmailLog(await sendEmail("confirmation", created, pin));
    }
  }

  async function handleCreateBlock(
    slot: Pick<Appointment, "date" | "time" | "therapistId" | "notes">,
  ) {
    const updated = await patchAgenda({
      action: "create_block",
      slot,
    });
    const block = updated?.find(
      (appointment) =>
        appointment.status === "blocked" &&
        appointment.date === slot.date &&
        appointment.time === slot.time &&
        appointment.therapistId === slot.therapistId,
    );

    if (block) {
      setSelectedSlot(null);
      setSelectedAppointment(block);
      setActionMessage("Hueco bloqueado. Ya no aparece como disponible.");
    }
  }

  function getStatusMessage(status: AppointmentStatus) {
    if (status === "awaiting_response") {
      return "Marcada como respuesta pendiente.";
    }

    if (status === "confirmed") {
      return "Marcada como respondida.";
    }

    if (status === "no_show") {
      return "Marcada como no presentado.";
    }

    return `Estado actualizado: ${formatStatus(status)}.`;
  }

  async function handleStatusChange(
    appointment: Appointment,
    status: AppointmentStatus,
  ) {
    const updated = await patchAgenda({
      action: "set_status",
      appointmentId: appointment.id,
      status,
    });
    const changed = updated?.find((item) => item.id === appointment.id);

    if (changed) {
      setSelectedAppointment(changed);
      setActionMessage(getStatusMessage(status));
    }
  }

  async function handleSendReminder(appointment: Appointment) {
    await handleStatusChange(appointment, "awaiting_response");
    addEmailLog(await sendEmail("reminder", appointment, pin));
    setActionMessage(
      "Recordatorio enviado. La cita queda en respuesta pendiente.",
    );
  }

  async function handleMoveCandidateToFreedSlot(
    appointment: Appointment,
    slot: FreedSlot,
  ) {
    const updated = await patchAgenda({
      action: "move",
      appointmentId: appointment.id,
      slot: {
        date: slot.date,
        time: slot.time,
        therapistId: slot.therapistId,
        treatmentId: appointment.treatmentId,
        notes:
          `Adelantada desde lista de espera. ${appointment.notes ?? ""}`.trim(),
        wantsEarlier: false,
      },
    });
    const moved = updated?.find((item) => item.id === appointment.id);

    if (moved) {
      setFreedSlot(null);
      setSelectedAppointment(moved);
      setActionMessage("Paciente recolocado y aviso de cambio enviado.");
      addEmailLog(await sendEmail("modification", moved, pin));
    }
  }

  return (
    <main className="bg-background text-foreground min-h-screen px-4 py-6 sm:px-6 sm:py-8 lg:px-12">
      <div className="mx-auto max-w-[1600px]">
        <Link
          href="/"
          className="text-muted-foreground hover:text-foreground mb-8 inline-flex items-center gap-2 text-sm transition-colors"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Volver a la web pública
        </Link>

        <header className="mb-8 max-w-3xl sm:mb-10">
          <span className="text-sage text-xs tracking-[0.18em] uppercase">
            Recepcion privada
          </span>
          <h1 className="font-display mt-3 text-4xl leading-tight sm:text-5xl lg:text-6xl">
            Panel de recepcion
          </h1>
          <p className="text-muted-foreground mt-4 text-base leading-relaxed sm:text-lg">
            Zona privada para revisar solicitudes, confirmar citas, bloquear
            huecos, mandar recordatorios y rellenar cancelaciones.
          </p>
        </header>

        {!authorized ? (
          <section className="glass shadow-elegant border-border/60 max-w-md rounded-xl border p-5 sm:p-6">
            <div className="mb-5 flex items-center gap-3">
              <div className="bg-sage/15 flex h-10 w-10 items-center justify-center rounded-md">
                <LockKeyhole className="text-sage h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <h2 className="text-base font-semibold">Acceso privado</h2>
                <p className="text-muted-foreground text-sm">
                  Introduce el PIN de recepcion.
                </p>
              </div>
            </div>
            <form className="space-y-4" onSubmit={handleLogin}>
              <label className="block">
                <span className="mb-2 block text-sm font-medium">PIN</span>
                <input
                  className="border-border bg-background focus:ring-ring/40 w-full rounded-lg border px-3 py-2 text-base outline-none focus:ring-2 sm:text-sm"
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
              <Button
                type="submit"
                className="w-full sm:w-auto"
                disabled={loading}
              >
                {loading ? "Comprobando..." : "Entrar"}
              </Button>
            </form>
          </section>
        ) : (
          <section className="grid gap-5 xl:grid-cols-[340px_minmax(0,1fr)]">
            {error ? (
              <p className="text-clay text-sm xl:col-span-2" role="alert">
                {error}
              </p>
            ) : null}
            <aside className="glass shadow-elegant border-border/60 overflow-hidden rounded-xl border xl:sticky xl:top-6 xl:max-h-[calc(100svh-3rem)] xl:self-start xl:overflow-y-auto">
              <div className="flex flex-col">
                <div className="flex flex-col gap-5 p-5 lg:p-6">
                  <div className="flex flex-col gap-3">
                    <div>
                      <div className="text-muted-foreground inline-flex items-center gap-2 text-xs font-medium tracking-[0.16em] uppercase">
                        <CalendarClock className="size-4" aria-hidden="true" />
                        Vista operativa
                      </div>
                      <h2 className="font-display mt-3 text-3xl leading-tight">
                        Cuadro de citas
                      </h2>
                    </div>
                    <div className="border-border/70 bg-background/70 rounded-md border px-3 py-2 text-sm">
                      <span className="text-muted-foreground block text-[11px] tracking-[0.12em] uppercase">
                        Proxima visita
                      </span>
                      <span className="font-medium tabular-nums">
                        {nextAppointment
                          ? `${formatAppointmentDate(nextAppointment.date)} · ${nextAppointment.time}`
                          : "Sin citas activas"}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      className="h-10"
                      disabled={loading}
                      onClick={() =>
                        setSelectedSlot({
                          date: dayFilter === "all" ? demoDates[0]! : dayFilter,
                          time: availableTimes[0]!,
                          therapistId:
                            therapistFilter === "all"
                              ? undefined
                              : therapistFilter,
                        })
                      }
                    >
                      <Plus className="size-4" aria-hidden="true" />
                      Nueva cita
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      className="border-border/70 bg-background/60 h-10 border"
                      disabled={loading}
                      onClick={() => loadAgenda(pin)}
                    >
                      Actualizar
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      className="border-border/70 bg-background/65 hover:border-clinical/40 hover:bg-clinical/10 rounded-lg border p-4 text-left transition-all"
                      onClick={() => setStatusFilter("pending")}
                    >
                      <div className="text-clinical flex items-center justify-between text-xs font-medium uppercase">
                        Pendientes
                        <CalendarCheck2 className="size-4" aria-hidden="true" />
                      </div>
                      <p className="font-display mt-3 text-3xl leading-none tabular-nums sm:text-4xl">
                        {pendingCount}
                      </p>
                      <p className="text-muted-foreground mt-2 text-xs">
                        necesitan confirmación humana
                      </p>
                    </button>
                    <button
                      type="button"
                      className="border-border/70 bg-sage/10 hover:border-sage/40 rounded-lg border p-4 text-left transition-all"
                      onClick={() => setStatusFilter("confirmed")}
                    >
                      <div className="text-sage flex items-center justify-between text-xs font-medium uppercase">
                        Confirmadas
                        <CheckCircle2 className="size-4" aria-hidden="true" />
                      </div>
                      <p className="font-display mt-3 text-3xl leading-none tabular-nums sm:text-4xl">
                        {confirmedCount}
                      </p>
                      <p className="text-muted-foreground mt-2 text-xs">
                        agenda bloqueada
                      </p>
                    </button>
                    <button
                      type="button"
                      className="border-border/70 bg-clay/10 hover:border-clay/40 rounded-lg border p-4 text-left transition-all"
                      onClick={() => setStatusFilter("cancelled")}
                    >
                      <div className="text-clay flex items-center justify-between text-xs font-medium uppercase">
                        Canceladas
                        <XCircle className="size-4" aria-hidden="true" />
                      </div>
                      <p className="font-display mt-3 text-3xl leading-none tabular-nums sm:text-4xl">
                        {cancelledCount}
                      </p>
                      <p className="text-muted-foreground mt-2 text-xs">
                        no ocupan agenda
                      </p>
                    </button>
                    <button
                      type="button"
                      className="border-border/70 rounded-lg border bg-amber-500/10 p-4 text-left transition-all hover:border-amber-500/40"
                      onClick={() => setStatusFilter("awaiting_response")}
                    >
                      <div className="flex items-center justify-between text-xs font-medium text-amber-700 uppercase">
                        Respuesta pendiente
                        <Mail className="size-4" aria-hidden="true" />
                      </div>
                      <p className="font-display mt-3 text-3xl leading-none tabular-nums sm:text-4xl">
                        {waitingCount}
                      </p>
                      <p className="text-muted-foreground mt-2 text-xs">
                        falta respuesta del paciente
                      </p>
                    </button>
                    <button
                      type="button"
                      className="border-border/70 bg-background/65 hover:border-sage/40 hover:bg-sage/10 rounded-lg border p-4 text-left transition-all"
                      onClick={() => setStatusFilter("all")}
                    >
                      <div className="text-sage flex items-center justify-between text-xs font-medium uppercase">
                        Lista espera
                        <Shuffle className="size-4" aria-hidden="true" />
                      </div>
                      <p className="font-display mt-3 text-3xl leading-none tabular-nums sm:text-4xl">
                        {waitlistCount}
                      </p>
                      <p className="text-muted-foreground mt-2 text-xs">
                        quieren venir antes
                      </p>
                    </button>
                    <button
                      type="button"
                      className="border-border/70 bg-background/65 rounded-lg border p-4 text-left transition-all hover:border-amber-500/40 hover:bg-amber-500/10"
                      onClick={() => setStatusFilter("blocked")}
                    >
                      <div className="flex items-center justify-between text-xs font-medium text-amber-700 uppercase">
                        Bloqueos
                        <XCircle className="size-4" aria-hidden="true" />
                      </div>
                      <p className="font-display mt-3 text-3xl leading-none tabular-nums sm:text-4xl">
                        {blockCount}
                      </p>
                      <p className="text-muted-foreground mt-2 text-xs">
                        huecos no disponibles
                      </p>
                    </button>
                    <div className="border-border/70 bg-background/65 rounded-lg border p-4 text-left">
                      <div className="text-muted-foreground flex items-center justify-between text-xs font-medium uppercase">
                        Tiempo ahorrado
                        <CalendarClock className="size-4" aria-hidden="true" />
                      </div>
                      <p className="font-display mt-3 text-3xl leading-none tabular-nums sm:text-4xl">
                        {estimatedMinutesSaved}
                      </p>
                      <p className="text-muted-foreground mt-2 text-xs">
                        minutos estimados en demo
                      </p>
                    </div>
                  </div>
                </div>

                <div className="border-border/60 flex flex-col justify-between gap-5 border-t p-5 lg:p-6">
                  <div>
                    <div className="text-muted-foreground mb-3 flex items-center gap-2 text-xs font-medium tracking-[0.16em] uppercase">
                      <Filter className="size-4" aria-hidden="true" />
                      Filtros
                    </div>
                    <div className="flex flex-col gap-4">
                      <label className="flex flex-col gap-2 text-sm font-medium">
                        Buscar
                        <div className="border-input bg-background focus-within:ring-ring/40 flex h-10 items-center gap-2 rounded-md border px-3 text-sm transition-shadow focus-within:ring-2">
                          <Search
                            className="text-muted-foreground size-4 shrink-0"
                            aria-hidden="true"
                          />
                          <input
                            className="placeholder:text-muted-foreground min-w-0 flex-1 bg-transparent outline-none"
                            value={searchQuery}
                            onChange={(event) =>
                              setSearchQuery(event.target.value)
                            }
                            placeholder="Paciente, email o tratamiento"
                          />
                          {searchQuery ? (
                            <button
                              type="button"
                              className="text-muted-foreground hover:text-foreground"
                              onClick={() => setSearchQuery("")}
                            >
                              <X className="size-4" aria-hidden="true" />
                              <span className="sr-only">Limpiar busqueda</span>
                            </button>
                          ) : null}
                        </div>
                      </label>

                      <label className="flex flex-col gap-2 text-sm font-medium">
                        Dia
                        <select
                          className="border-input bg-background focus:ring-ring/40 h-10 rounded-md border px-3 text-sm outline-none focus:ring-2"
                          value={dayFilter}
                          onChange={(event) => setDayFilter(event.target.value)}
                        >
                          <option value="all">Todos los dias</option>
                          {agendaDays.map((day) => (
                            <option key={day} value={day}>
                              {formatAppointmentDate(day)}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="flex flex-col gap-2 text-sm font-medium">
                        Profesional
                        <select
                          className="border-input bg-background focus:ring-ring/40 h-10 rounded-md border px-3 text-sm outline-none focus:ring-2"
                          value={therapistFilter}
                          onChange={(event) =>
                            setTherapistFilter(event.target.value)
                          }
                        >
                          <option value="all">Todos los profesionales</option>
                          {therapists.map((therapist) => (
                            <option key={therapist.id} value={therapist.id}>
                              {therapist.name}
                            </option>
                          ))}
                        </select>
                      </label>

                      <div className="flex flex-col gap-2">
                        <span className="text-sm font-medium">Estado</span>
                        <div className="bg-background/70 border-border/70 grid grid-cols-2 rounded-md border p-1">
                          {statusOptions.map((option) => (
                            <button
                              key={option.value}
                              type="button"
                              aria-pressed={statusFilter === option.value}
                              className={cn(
                                "rounded px-2 py-2 text-xs font-medium transition-colors",
                                statusFilter === option.value
                                  ? "bg-primary text-primary-foreground"
                                  : "text-muted-foreground hover:text-foreground",
                              )}
                              onClick={() => setStatusFilter(option.value)}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="border-border/60 bg-background/55 rounded-lg border px-4 py-3 text-sm">
                    <span className="text-muted-foreground block text-xs">
                      Mostrando
                    </span>
                    <strong className="font-display text-2xl font-normal tabular-nums">
                      {filteredAppointments.length}
                    </strong>{" "}
                    de {appointments.length} citas
                  </div>
                </div>
              </div>
            </aside>

            <div className="flex min-w-0 flex-col gap-5">
              {freedSlot ? (
                <FreedSlotPanel
                  candidates={waitlistCandidates}
                  loading={loading}
                  slot={freedSlot}
                  onDismiss={() => setFreedSlot(null)}
                  onMoveCandidate={handleMoveCandidateToFreedSlot}
                />
              ) : null}

              <AppointmentCalendar
                appointments={filteredAppointments}
                selectedDay={dayFilter}
                selectedTherapist={therapistFilter}
                onMoveToSlot={handleMoveToSlot}
                onSelectAppointment={(appointment) => {
                  setSelectedSlot(null);
                  setEditingAppointment(null);
                  setActionMessage("");
                  setSelectedAppointment(appointment);
                }}
                onSelectSlot={(slot) => {
                  setSelectedAppointment(null);
                  setEditingAppointment(null);
                  setActionMessage("");
                  setSelectedSlot(slot);
                }}
              />

              <EmailLog emails={emails} />
            </div>

            {selectedAppointment ? (
              <AppointmentDetailModal
                appointment={selectedAppointment}
                loading={loading}
                onClose={() => setSelectedAppointment(null)}
                onConfirm={handleConfirm}
                onCancel={handleCancel}
                onEdit={(appointment) => {
                  setSelectedAppointment(null);
                  setEditingAppointment(appointment);
                }}
                onSendReminder={handleSendReminder}
                onStatusChange={handleStatusChange}
                statusMessage={actionMessage}
              />
            ) : null}

            {editingAppointment ? (
              <AppointmentEditModal
                appointment={editingAppointment}
                loading={loading}
                onClose={() => setEditingAppointment(null)}
                onSave={handleEditAppointment}
              />
            ) : null}

            {selectedSlot ? (
              <FreeSlotModal
                loading={loading}
                slot={selectedSlot}
                onClose={() => setSelectedSlot(null)}
                onCreate={handleCreateAppointment}
                onCreateBlock={handleCreateBlock}
              />
            ) : null}
          </section>
        )}
      </div>
    </main>
  );
}
