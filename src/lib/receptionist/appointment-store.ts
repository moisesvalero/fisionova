import {
  bookAppointment,
  cancelAppointment,
  confirmAppointment,
  isSlotAvailable,
  requestAppointment,
  resetAgenda,
  updateAppointment,
  updateAppointmentStatus,
} from "./agenda";
import type { Appointment } from "./types";

type BookingInput = Omit<Appointment, "id" | "status">;
type BlockInput = Pick<Appointment, "date" | "time" | "therapistId" | "notes">;

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

export function blockDemoSlot(input: BlockInput) {
  const appointments = getAppointmentsRef();
  if (!isSlotAvailable(appointments, input)) {
    throw new Error("Slot is not available");
  }

  const appointment = {
    id: `block-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    patientName: `Bloqueo: ${input.notes || "Agenda"}`,
    patientEmail: "recepcion@fisionova.demo",
    patientPhone: "-",
    treatmentId: "general",
    therapistId: input.therapistId,
    date: input.date,
    time: input.time,
    status: "blocked" as const,
    notes: input.notes || "Bloqueo manual de recepcion.",
    wantsEarlier: false,
  } satisfies Appointment;

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
    Pick<
      Appointment,
      "date" | "time" | "therapistId" | "treatmentId" | "notes" | "wantsEarlier"
    >
  >,
) {
  setAppointments(
    updateAppointment(getAppointmentsRef(), appointmentId, changes),
  );

  return getDemoAppointments();
}

export function updateDemoAppointmentStatus(
  appointmentId: string,
  status: Appointment["status"],
) {
  setAppointments(
    updateAppointmentStatus(getAppointmentsRef(), appointmentId, status),
  );

  return getDemoAppointments();
}
