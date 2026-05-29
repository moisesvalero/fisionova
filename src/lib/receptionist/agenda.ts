import {
  availableTimes,
  demoDates,
  seedAppointments,
  therapists,
} from "./demo-data";
import type { Appointment, AppointmentSlot } from "./types";

type BookingInput = Omit<Appointment, "id" | "status">;

const blockingStatuses: Appointment["status"][] = [
  "pending",
  "awaiting_response",
  "confirmed",
  "patient_confirmed",
  "reschedule_proposed",
  "payment_pending",
  "blocked",
];

export function isBlockingAppointment(appointment: Appointment) {
  return blockingStatuses.includes(appointment.status);
}

export function resetAgenda(): Appointment[] {
  return seedAppointments.map((appointment) => ({ ...appointment }));
}

export function isSlotAvailable(
  appointments: Appointment[],
  slot: Pick<AppointmentSlot, "date" | "time" | "therapistId">,
) {
  return !appointments.some(
    (appointment) =>
      isBlockingAppointment(appointment) &&
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

export function requestAppointment(
  appointments: Appointment[],
  input: BookingInput,
): Appointment {
  if (!isSlotAvailable(appointments, input)) {
    throw new Error("Slot is not available");
  }

  return {
    id: `apt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    ...input,
    status: "pending",
  };
}

export function confirmAppointment(
  appointments: Appointment[],
  appointmentId: string,
): Appointment[] {
  const current = appointments.find(
    (appointment) => appointment.id === appointmentId,
  );

  if (!current) {
    throw new Error("Appointment not found");
  }

  if (current.status === "cancelled") {
    throw new Error("Cancelled appointments cannot be confirmed");
  }

  const others = appointments.filter(
    (appointment) => appointment.id !== appointmentId,
  );

  if (!isSlotAvailable(others, current)) {
    throw new Error("Slot is not available");
  }

  return appointments.map((appointment) =>
    appointment.id === appointmentId
      ? { ...appointment, status: "confirmed" }
      : appointment,
  );
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
    Pick<
      Appointment,
      "date" | "time" | "therapistId" | "treatmentId" | "notes" | "wantsEarlier"
    >
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

export function updateAppointmentStatus(
  appointments: Appointment[],
  appointmentId: string,
  status: Appointment["status"],
): Appointment[] {
  const current = appointments.find(
    (appointment) => appointment.id === appointmentId,
  );

  if (!current) {
    throw new Error("Appointment not found");
  }

  if (status === "blocked") {
    throw new Error("Use a block action to create blocked slots");
  }

  return appointments.map((appointment) =>
    appointment.id === appointmentId ? { ...appointment, status } : appointment,
  );
}
