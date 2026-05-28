import {
  availableTimes,
  demoDates,
  seedAppointments,
  therapists,
} from "./demo-data";
import type { Appointment, AppointmentSlot } from "./types";

type BookingInput = Omit<Appointment, "id" | "status">;

export function resetAgenda(): Appointment[] {
  return seedAppointments.map((appointment) => ({ ...appointment }));
}

export function isSlotAvailable(
  appointments: Appointment[],
  slot: Pick<AppointmentSlot, "date" | "time" | "therapistId">,
) {
  return !appointments.some(
    (appointment) =>
      appointment.status === "confirmed" &&
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
      "date" | "time" | "therapistId" | "treatmentId" | "notes"
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
