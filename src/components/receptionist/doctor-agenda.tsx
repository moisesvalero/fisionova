"use client";

import { FormEvent, useMemo, useState } from "react";
import {
  ArrowLeft,
  CalendarCheck2,
  CalendarClock,
  CheckCircle2,
  Filter,
  LockKeyhole,
  SearchX,
  XCircle,
} from "lucide-react";
import Link from "next/link";

import { AgendaPanel } from "@/components/receptionist/agenda-panel";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { findAvailableSlots } from "@/lib/receptionist/agenda";
import {
  availableTimes,
  demoDates,
  therapists,
  treatments,
} from "@/lib/receptionist/demo-data";
import type { Appointment, EmailEventType } from "@/lib/receptionist/types";

type AppointmentsPayload = {
  appointments: Appointment[];
};

type StatusFilter = Appointment["status"] | "all";

const statusOptions: Array<{ label: string; value: StatusFilter }> = [
  { label: "Todas", value: "all" },
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

function AppointmentCalendar({
  appointments,
  selectedDay,
}: {
  appointments: Appointment[];
  selectedDay: string;
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
            Vista tipo Google Calendar
          </h2>
        </div>
        <p className="text-muted-foreground text-sm">
          Horas bloqueadas, pacientes y profesional asignado.
        </p>
      </header>

      <div className="overflow-x-auto">
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
                  >
                    {slotAppointments.length > 0 ? (
                      <div className="space-y-2">
                        {slotAppointments.map((appointment) => (
                          <div
                            key={appointment.id}
                            className={cn(
                              "rounded-md border px-3 py-2 text-xs shadow-sm",
                              appointment.status === "confirmed"
                                ? "border-sage/30 bg-sage/15"
                                : "border-clay/30 bg-clay/10 opacity-75",
                            )}
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
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="border-border/50 text-muted-foreground/70 flex h-full min-h-28 items-center justify-center rounded-md border border-dashed text-xs">
                        Libre
                      </div>
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
  const [dayFilter, setDayFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const confirmedCount = useMemo(
    () => countByStatus(appointments, "confirmed"),
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

                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="border-border/70 bg-background/65 rounded-lg border p-4">
                      <div className="text-muted-foreground flex items-center justify-between text-xs font-medium uppercase">
                        Total
                        <CalendarCheck2 className="size-4" aria-hidden="true" />
                      </div>
                      <p className="font-display mt-3 text-4xl leading-none tabular-nums">
                        {appointments.length}
                      </p>
                      <p className="text-muted-foreground mt-2 text-xs">
                        citas registradas
                      </p>
                    </div>
                    <div className="border-border/70 bg-sage/10 rounded-lg border p-4">
                      <div className="text-sage flex items-center justify-between text-xs font-medium uppercase">
                        Confirmadas
                        <CheckCircle2 className="size-4" aria-hidden="true" />
                      </div>
                      <p className="font-display mt-3 text-4xl leading-none tabular-nums">
                        {confirmedCount}
                      </p>
                      <p className="text-muted-foreground mt-2 text-xs">
                        pendientes de atender
                      </p>
                    </div>
                    <div className="border-border/70 bg-clay/10 rounded-lg border p-4">
                      <div className="text-clay flex items-center justify-between text-xs font-medium uppercase">
                        Canceladas
                        <XCircle className="size-4" aria-hidden="true" />
                      </div>
                      <p className="font-display mt-3 text-4xl leading-none tabular-nums">
                        {cancelledCount}
                      </p>
                      <p className="text-muted-foreground mt-2 text-xs">
                        no ocupan agenda
                      </p>
                    </div>
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
                        <div className="bg-background/70 border-border/70 grid grid-cols-3 rounded-md border p-1">
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
            />

            {filteredAppointments.length > 0 ? (
              <AgendaPanel
                appointments={filteredAppointments}
                onCancel={handleCancel}
                onMove={handleMove}
                onReset={handleReset}
              />
            ) : (
              <div className="glass shadow-elegant border-border/60 flex min-h-52 flex-col items-center justify-center rounded-xl border px-6 py-10 text-center">
                <SearchX
                  className="text-muted-foreground mb-3 size-8"
                  aria-hidden="true"
                />
                <h2 className="text-base font-semibold">
                  No hay citas con estos filtros
                </h2>
                <p className="text-muted-foreground mt-2 max-w-md text-sm">
                  Cambia el dia o el estado para revisar el resto de la agenda
                  privada.
                </p>
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  );
}
