import { describe, expect, it, vi } from "vitest";

import {
  bookDemoAppointment,
  getDemoAppointments,
  requestDemoAppointment,
  resetDemoAppointmentStore,
} from "./appointment-store";

describe("appointment store", () => {
  it("keeps booked appointments in the backend demo store", () => {
    resetDemoAppointmentStore();

    const appointment = bookDemoAppointment({
      patientName: "Paciente Demo",
      patientEmail: "paciente@example.com",
      patientPhone: "600 000 000",
      treatmentId: "general",
      therapistId: "marta",
      date: "2026-06-01",
      time: "10:00",
      notes: "Cita creada desde test.",
    });

    expect(getDemoAppointments()).toContainEqual(appointment);
  });

  it("keeps requested appointments after a route module reload in dev", async () => {
    resetDemoAppointmentStore();

    const appointment = requestDemoAppointment({
      patientName: "Paciente Pendiente",
      patientEmail: "pendiente@example.com",
      patientPhone: "600 000 001",
      treatmentId: "general",
      therapistId: "marta",
      date: "2026-06-05",
      time: "18:00",
      notes: "Cita pendiente creada desde test.",
    });

    vi.resetModules();

    const { getDemoAppointments: getReloadedDemoAppointments } =
      await import("./appointment-store");

    expect(getReloadedDemoAppointments()).toContainEqual(appointment);
  });
});
