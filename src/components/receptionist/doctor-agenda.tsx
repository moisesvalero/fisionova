"use client";

import { FormEvent, useMemo, useState } from "react";
import {
  ArrowLeft,
  CalendarCheck2,
  CalendarClock,
  CheckCircle2,
  Filter,
  LockKeyhole,
  Mail,
  Phone,
  Shuffle,
  UserRound,
  X,
  XCircle,
} from "lucide-react";
import Link from "next/link";

import { EmailLog } from "@/components/receptionist/email-log";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { findAvailableSlots } from "@/lib/receptionist/agenda";
import {
  availableTimes,
  demoDates,
  therapists,
  treatments,
} from "@/lib/receptionist/demo-data";
import type {
  Appointment,
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

type StatusFilter = Appointment["status"] | "all";

const statusOptions: Array<{ label: string; value: StatusFilter }> = [
  { label: "Todas", value: "all" },
  { label: "Pendientes", value: "pending" },
  { label: "Confirmadas", value: "confirmed" },
  { label: "Canceladas", value: "cancelled" },
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

function countByStatus(
  appointments: Appointment[],
  status: Appointment["status"],
) {
  return appointments.filter((appointment) => appointment.status === status)
    .length;
}

function resolveTreatment(id: string) {
  return treatments.find((treatment) => treatment.id === id)?.name ?? id;
}

function resolveTherapist(id: string) {
  return therapists.find((therapist) => therapist.id === id)?.name ?? id;
}

function formatStatus(status: Appointment["status"]) {
  if (status === "pending") {
    return "Pendiente";
  }

  if (status === "confirmed") {
    return "Confirmada";
  }

  return "Cancelada";
}

function getStatusTone(status: Appointment["status"]) {
  if (status === "pending") {
    return "border-clinical/30 bg-clinical/10 text-clinical";
  }

  if (status === "confirmed") {
    return "border-sage/30 bg-sage/10 text-sage";
  }

  return "border-clay/30 bg-clay/10 text-clay";
}

function AppointmentDetailModal({
  appointment,
  loading,
  onCancel,
  onClose,
  onConfirm,
  onMove,
}: {
  appointment: Appointment;
  loading: boolean;
  onCancel: (appointment: Appointment) => void;
  onClose: () => void;
  onConfirm: (appointment: Appointment) => void;
  onMove: (appointment: Appointment) => void;
}) {
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
              {appointment.status !== "cancelled" ? (
                <>
                  <Button
                    type="button"
                    variant="ghost"
                    disabled={loading}
                    onClick={() => onMove(appointment)}
                  >
                    <Shuffle className="size-4" aria-hidden="true" />
                    Mover al siguiente hueco
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    disabled={loading}
                    onClick={() => onCancel(appointment)}
                  >
                    <XCircle className="size-4" aria-hidden="true" />
                    Cancelar cita
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

function FreeSlotModal({
  slot,
  onClose,
}: {
  slot: Pick<AppointmentSlot, "date" | "time">;
  onClose: () => void;
}) {
  return (
    <div
      className="modal-backdrop bg-charcoal/70 fixed inset-0 z-50 flex items-end justify-center px-3 py-3 backdrop-blur-sm sm:items-center sm:px-4 sm:py-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="free-slot-title"
    >
      <article className="modal-panel glass shadow-elegant border-border/60 relative max-h-[calc(100dvh-1.5rem)] w-full max-w-xl overflow-y-auto rounded-2xl border">
        <button
          type="button"
          className="text-muted-foreground hover:text-foreground hover:bg-background/70 absolute top-4 right-4 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full transition-colors"
          onClick={onClose}
        >
          <X className="size-5" aria-hidden="true" />
          <span className="sr-only">Cerrar hueco libre</span>
        </button>

        <div className="px-5 py-5 pr-16 sm:px-7">
          <span className="text-sage text-xs font-medium tracking-[0.16em] uppercase">
            Hueco libre
          </span>
          <h2
            id="free-slot-title"
            className="font-display mt-3 text-2xl leading-tight sm:text-3xl"
          >
            {formatAppointmentDate(slot.date)} · {slot.time}
          </h2>
          <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
            Puedes arrastrar una cita hasta este hueco para moverla manteniendo
            su terapeuta y tratamiento. La demo aún no crea citas manuales desde
            este modal.
          </p>
        </div>
      </article>
    </div>
  );
}

function AppointmentCalendar({
  appointments,
  selectedDay,
  onMoveToSlot,
  onSelectAppointment,
  onSelectSlot,
}: {
  appointments: Appointment[];
  selectedDay: string;
  onMoveToSlot: (
    appointment: Appointment,
    slot: Pick<AppointmentSlot, "date" | "time">,
  ) => void;
  onSelectAppointment: (appointment: Appointment) => void;
  onSelectSlot: (slot: Pick<AppointmentSlot, "date" | "time">) => void;
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
                              "focus:ring-ring/40 w-full rounded-lg border px-3 py-3 text-left text-sm shadow-sm transition-all focus:ring-2 focus:outline-none",
                              appointment.status === "confirmed"
                                ? "border-sage/30 bg-sage/15"
                                : appointment.status === "pending"
                                  ? "border-clinical/30 bg-clinical/10"
                                  : "border-clay/30 bg-clay/10 opacity-75",
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
                                  appointment.status === "confirmed"
                                    ? "bg-sage"
                                    : appointment.status === "pending"
                                      ? "bg-clinical"
                                      : "bg-clay",
                                )}
                              />
                            </div>
                            <p className="text-muted-foreground mt-1 leading-snug">
                              {resolveTreatment(appointment.treatmentId)}
                            </p>
                            <p className="text-muted-foreground mt-1 leading-snug">
                              {resolveTherapist(appointment.therapistId)}
                            </p>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <button
                        type="button"
                        className="border-border/50 text-muted-foreground hover:border-sage/40 hover:bg-sage/10 hover:text-foreground min-h-12 w-full rounded-lg border border-dashed px-3 py-3 text-sm transition-colors"
                        onClick={() => onSelectSlot({ date: day, time })}
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
                            draggable={appointment.status !== "cancelled"}
                            className={cn(
                              "focus:ring-ring/40 w-full rounded-md border px-3 py-2 text-left text-xs shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md focus:ring-2 focus:outline-none",
                              appointment.status === "confirmed"
                                ? "border-sage/30 bg-sage/15"
                                : appointment.status === "pending"
                                  ? "border-clinical/30 bg-clinical/10"
                                  : "border-clay/30 bg-clay/10 opacity-75",
                            )}
                            onClick={() => onSelectAppointment(appointment)}
                            onDragStart={(event) => {
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
                                  appointment.status === "confirmed"
                                    ? "bg-sage"
                                    : appointment.status === "pending"
                                      ? "bg-clinical"
                                      : "bg-clay",
                                )}
                              />
                            </div>
                            <p className="text-muted-foreground mt-1 truncate">
                              {resolveTreatment(appointment.treatmentId)}
                            </p>
                            <p className="text-muted-foreground mt-1 truncate">
                              {resolveTherapist(appointment.therapistId)}
                            </p>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <button
                        type="button"
                        className="border-border/50 text-muted-foreground/70 hover:border-sage/40 hover:bg-sage/10 hover:text-foreground flex h-full min-h-28 w-full items-center justify-center rounded-md border border-dashed text-xs transition-colors"
                        onClick={() => onSelectSlot({ date: day, time })}
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
  const [selectedAppointment, setSelectedAppointment] =
    useState<Appointment | null>(null);
  const [emails, setEmails] = useState<EmailLogItem[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<Pick<
    AppointmentSlot,
    "date" | "time"
  > | null>(null);

  function addEmailLog(email: EmailLogItem) {
    setEmails((current) => [email, ...current].slice(0, 8));

    if (email.status === "failed") {
      setError(
        "La cita se actualizó, pero Resend no ha enviado el email. Revisa el remitente o el dominio.",
      );
    }
  }

  const confirmedCount = useMemo(
    () => countByStatus(appointments, "confirmed"),
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
  const agendaDays = useMemo(
    () =>
      Array.from(new Set(appointments.map((appointment) => appointment.date))),
    [appointments],
  );
  const filteredAppointments = useMemo(
    () =>
      appointments.filter((appointment) => {
        const matchesDay =
          dayFilter === "all" || appointment.date === dayFilter;
        const matchesStatus =
          statusFilter === "all" || appointment.status === statusFilter;

        return matchesDay && matchesStatus;
      }),
    [appointments, dayFilter, statusFilter],
  );
  const nextAppointment = useMemo(
    () =>
      appointments.find((appointment) => appointment.status === "confirmed") ??
      null,
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

  async function handleCancel(appointment: Appointment) {
    const updated = await patchAgenda({
      action: "cancel",
      appointmentId: appointment.id,
    });
    const cancelled = updated?.find((item) => item.id === appointment.id);

    if (cancelled) {
      setSelectedAppointment(cancelled);
    }

    addEmailLog(
      await sendEmail(
        "cancellation",
        { ...appointment, status: "cancelled" },
        pin,
      ),
    );
  }

  async function handleConfirm(appointment: Appointment) {
    const updated = await patchAgenda({
      action: "confirm",
      appointmentId: appointment.id,
    });
    const confirmed = updated?.find((item) => item.id === appointment.id);

    if (confirmed) {
      setSelectedAppointment(confirmed);
      addEmailLog(await sendEmail("confirmation", confirmed, pin));
    }
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
      setSelectedAppointment(moved);
      addEmailLog(await sendEmail("modification", moved, pin));
    }
  }

  async function handleMoveToSlot(
    appointment: Appointment,
    slot: Pick<AppointmentSlot, "date" | "time">,
  ) {
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
      setSelectedAppointment(moved);
      addEmailLog(await sendEmail("modification", moved, pin));
    }
  }

  return (
    <main className="bg-background text-foreground min-h-screen px-4 py-6 sm:px-6 sm:py-8 lg:px-12">
      <div className="mx-auto max-w-7xl">
        <Link
          href="/"
          className="text-muted-foreground hover:text-foreground mb-8 inline-flex items-center gap-2 text-sm transition-colors"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Volver a la web pública
        </Link>

        <header className="mb-8 max-w-3xl sm:mb-10">
          <span className="text-sage text-xs tracking-[0.18em] uppercase">
            Backend privado
          </span>
          <h1 className="font-display mt-3 text-4xl leading-tight sm:text-5xl lg:text-6xl">
            Agenda del médico
          </h1>
          <p className="text-muted-foreground mt-4 text-base leading-relaxed sm:text-lg">
            Este panel simula la zona privada de la clínica. Aquí sí se ven las
            citas completas y se pueden mover, cancelar o restablecer.
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
                  Introduce el PIN del médico.
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
          <section className="flex flex-col gap-5">
            {error ? (
              <p className="text-clay text-sm" role="alert">
                {error}
              </p>
            ) : null}
            <div className="glass shadow-elegant border-border/60 overflow-hidden rounded-xl border">
              <div className="border-border/60 grid gap-0 border-b lg:grid-cols-[1.1fr_0.9fr]">
                <div className="flex flex-col gap-5 p-5 lg:p-6">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
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
                      variant="ghost"
                      className="border-border/70 bg-background/60 h-10 border"
                      disabled={loading}
                      onClick={() => loadAgenda(pin)}
                    >
                      Actualizar
                    </Button>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3">
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
                  </div>
                </div>

                <div className="border-border/60 flex flex-col justify-between gap-5 border-t p-5 lg:border-t-0 lg:border-l lg:p-6">
                  <div>
                    <div className="text-muted-foreground mb-3 flex items-center gap-2 text-xs font-medium tracking-[0.16em] uppercase">
                      <Filter className="size-4" aria-hidden="true" />
                      Filtros
                    </div>
                    <div className="flex flex-col gap-4">
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

                      <div className="flex flex-col gap-2">
                        <span className="text-sm font-medium">Estado</span>
                        <div className="bg-background/70 border-border/70 grid grid-cols-2 rounded-md border p-1 sm:grid-cols-4">
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
            </div>

            <AppointmentCalendar
              appointments={filteredAppointments}
              selectedDay={dayFilter}
              onMoveToSlot={handleMoveToSlot}
              onSelectAppointment={(appointment) => {
                setSelectedSlot(null);
                setSelectedAppointment(appointment);
              }}
              onSelectSlot={(slot) => {
                setSelectedAppointment(null);
                setSelectedSlot(slot);
              }}
            />

            <EmailLog emails={emails} />

            {selectedAppointment ? (
              <AppointmentDetailModal
                appointment={selectedAppointment}
                loading={loading}
                onClose={() => setSelectedAppointment(null)}
                onConfirm={handleConfirm}
                onCancel={handleCancel}
                onMove={handleMove}
              />
            ) : null}

            {selectedSlot ? (
              <FreeSlotModal
                slot={selectedSlot}
                onClose={() => setSelectedSlot(null)}
              />
            ) : null}
          </section>
        )}
      </div>
    </main>
  );
}
