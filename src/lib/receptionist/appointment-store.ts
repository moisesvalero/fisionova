import {
  bookAppointment,
  cancelAppointment,
  resetAgenda,
  updateAppointment,
} from "./agenda";
import type { Appointment } from "./types";

type BookingInput = Omit<Appointment, "id" | "status">;

let appointments = resetAgenda();

export function getDemoAppointments() {
  return appointments.map((appointment) => ({ ...appointment }));
}

export function resetDemoAppointmentStore() {
  appointments = resetAgenda();

  return getDemoAppointments();
}

export function bookDemoAppointment(input: BookingInput) {
  const appointment = bookAppointment(appointments, input);
  appointments = [...appointments, appointment];

  return appointment;
}

export function cancelDemoAppointment(appointmentId: string) {
  appointments = cancelAppointment(appointments, appointmentId);

  return getDemoAppointments();
}

export function moveDemoAppointment(
  appointmentId: string,
  changes: Partial<
    Pick<Appointment, "date" | "time" | "therapistId" | "treatmentId" | "notes">
  >,
) {
  appointments = updateAppointment(appointments, appointmentId, changes);

  return getDemoAppointments();
}
