import { describe, expect, it } from "vitest";

import {
  bookDemoAppointment,
  getDemoAppointments,
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
      time: "09:30",
      notes: "Cita creada desde test.",
    });

    expect(getDemoAppointments()).toContainEqual(appointment);
  });
});
