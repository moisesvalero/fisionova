import {
  bookAppointment,
  cancelAppointment,
  confirmAppointment,
  requestAppointment,
  resetAgenda,
  updateAppointment,
} from "./agenda";
import type { Appointment } from "./types";

type BookingInput = Omit<Appointment, "id" | "status">;

const globalForAppointments = globalThis as typeof globalThis & {
  __fisionovaDemoAppointments?: Appointment[];
};

function getAppointmentsRef() {
  globalForAppointments.__fisionovaDemoAppointments ??= resetAgenda();

  return globalForAppointments.__fisionovaDemoAppointments;
}

function setAppointments(nextAppointments: Appointment[]) {
  globalForAppointments.__fisionovaDemoAppointments = nextAppointments;
}

export function getDemoAppointments() {
  return getAppointmentsRef().map((appointment) => ({ ...appointment }));
}

export function resetDemoAppointmentStore() {
  setAppointments(resetAgenda());

  return getDemoAppointments();
}

export function bookDemoAppointment(input: BookingInput) {
  const appointments = getAppointmentsRef();
  const appointment = bookAppointment(appointments, input);
  setAppointments([...appointments, appointment]);

  return appointment;
}

export function requestDemoAppointment(input: BookingInput) {
  const appointments = getAppointmentsRef();
  const appointment = requestAppointment(appointments, input);
  setAppointments([...appointments, appointment]);

  return appointment;
}

export function confirmDemoAppointment(appointmentId: string) {
  setAppointments(confirmAppointment(getAppointmentsRef(), appointmentId));

  const appointment = getAppointmentsRef().find(
    (item) => item.id === appointmentId,
  );

  if (!appointment) {
    throw new Error("Appointment not found");
  }

  return {
    appointment,
    appointments: getDemoAppointments(),
  };
}

export function cancelDemoAppointment(appointmentId: string) {
  setAppointments(cancelAppointment(getAppointmentsRef(), appointmentId));

  return getDemoAppointments();
}

export function moveDemoAppointment(
  appointmentId: string,
  changes: Partial<
    Pick<Appointment, "date" | "time" | "therapistId" | "treatmentId" | "notes">
  >,
) {
  setAppointments(
    updateAppointment(getAppointmentsRef(), appointmentId, changes),
  );

  return getDemoAppointments();
}
