import { describe, expect, it } from "vitest";

import { seedAppointments } from "./demo-data";
import {
  bookAppointment,
  cancelAppointment,
  findAvailableSlots,
  resetAgenda,
  updateAppointment,
} from "./agenda";

describe("agenda", () => {
  it("does not offer an already booked slot", () => {
    const slots = findAvailableSlots(seedAppointments, {
      date: "2026-06-02",
      treatmentId: "sports",
    });

    expect(slots).not.toContainEqual(
      expect.objectContaining({
        date: "2026-06-02",
        time: "17:30",
        therapistId: "marta",
      }),
    );
  });

  it("books a new appointment in an available slot", () => {
    const appointment = bookAppointment(seedAppointments, {
      patientName: "Carlos Perez",
      patientEmail: "carlos@example.com",
      patientPhone: "600 333 444",
      treatmentId: "general",
      therapistId: "alvaro",
      date: "2026-06-03",
      time: "10:30",
      notes: "Dolor cervical.",
    });

    expect(appointment.patientName).toBe("Carlos Perez");
    expect(appointment.status).toBe("confirmed");
    expect(appointment.id).toMatch(/^apt-/);
  });

  it("rejects booking a taken slot", () => {
    expect(() =>
      bookAppointment(seedAppointments, {
        patientName: "Carlos Perez",
        patientEmail: "carlos@example.com",
        patientPhone: "600 333 444",
        treatmentId: "sports",
        therapistId: "marta",
        date: "2026-06-02",
        time: "17:30",
      }),
    ).toThrow("Slot is not available");
  });

  it("cancels an appointment", () => {
    const appointments = cancelAppointment(seedAppointments, "apt-demo-1");

    expect(appointments[0]?.status).toBe("cancelled");
  });

  it("updates an appointment to a free slot", () => {
    const appointments = updateAppointment(seedAppointments, "apt-demo-1", {
      date: "2026-06-03",
      time: "16:30",
      therapistId: "alvaro",
    });

    expect(appointments[0]).toMatchObject({
      date: "2026-06-03",
      time: "16:30",
      therapistId: "alvaro",
      status: "confirmed",
    });
  });

  it("resets to seed appointments", () => {
    expect(resetAgenda()).toEqual(seedAppointments);
  });
});
