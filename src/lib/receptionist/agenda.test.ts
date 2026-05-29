import { describe, expect, it } from "vitest";

import { seedAppointments } from "./demo-data";
import {
  bookAppointment,
  cancelAppointment,
  findAvailableSlots,
  isSlotAvailable,
  resetAgenda,
  updateAppointment,
  updateAppointmentStatus,
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
        time: "17:00",
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
      time: "11:00",
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
        time: "17:00",
      }),
    ).toThrow("Slot is not available");
  });

  it("cancels an appointment", () => {
    const appointments = cancelAppointment(seedAppointments, "apt-demo-1");

    expect(appointments[0]?.status).toBe("cancelled");
  });

  it("does not block slots for no-show appointments", () => {
    const appointments = updateAppointmentStatus(
      seedAppointments,
      "apt-demo-1",
      "no_show",
    );
    expect(
      isSlotAvailable(appointments, {
        date: "2026-06-02",
        time: "17:00",
        therapistId: "marta",
      }),
    ).toBe(true);
  });

  it("updates an appointment to a free slot", () => {
    const appointments = updateAppointment(seedAppointments, "apt-demo-1", {
      date: "2026-06-03",
      time: "16:00",
      therapistId: "alvaro",
    });

    expect(appointments[0]).toMatchObject({
      date: "2026-06-03",
      time: "16:00",
      therapistId: "alvaro",
      status: "confirmed",
    });
  });

  it("resets to seed appointments", () => {
    const resetAppointments = resetAgenda();

    expect(resetAppointments).toHaveLength(seedAppointments.length);
    expect(resetAppointments[0]).toMatchObject(seedAppointments[0]!);
    expect(
      resetAppointments.some((appointment) => appointment.source === "ai"),
    ).toBe(true);
    expect(
      resetAppointments.some((appointment) => appointment.source === "manual"),
    ).toBe(true);
  });
});
