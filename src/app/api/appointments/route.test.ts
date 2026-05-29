import { describe, expect, it } from "vitest";

import { resetDemoAppointmentStore } from "@/lib/receptionist/appointment-store";

import { GET, PATCH, POST } from "./route";

describe("/api/appointments", () => {
  it("rejects private agenda reads without the doctor PIN", async () => {
    const response = await GET(
      new Request("http://localhost/api/appointments"),
    );

    expect(response.status).toBe(401);
  });

  it("creates a pending public request and exposes it only to private reads", async () => {
    resetDemoAppointmentStore();

    const booking = await POST(
      new Request("http://localhost/api/appointments", {
        method: "POST",
        body: JSON.stringify({
          slot: {
            date: "2026-06-01",
            time: "10:00",
            therapistId: "marta",
            treatmentId: "general",
          },
        }),
      }),
    );

    expect(booking.status).toBe(200);

    const privateRead = await GET(
      new Request("http://localhost/api/appointments", {
        headers: { "x-doctor-pin": "1234" },
      }),
    );
    const payload = (await privateRead.json()) as {
      appointments: Array<{ time: string; status: string }>;
    };

    expect(privateRead.status).toBe(200);
    expect(payload.appointments).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ time: "10:00", status: "pending" }),
      ]),
    );
  });

  it("lets the private doctor confirm a pending request", async () => {
    resetDemoAppointmentStore();

    const booking = await POST(
      new Request("http://localhost/api/appointments", {
        method: "POST",
        body: JSON.stringify({
          patientName: "María López",
          patientEmail: "maria@example.com",
          patientPhone: "611 222 333",
          slot: {
            date: "2026-06-01",
            time: "11:00",
            therapistId: "marta",
            treatmentId: "general",
          },
        }),
      }),
    );
    const bookingPayload = (await booking.json()) as {
      appointment: { id: string; status: string };
    };

    expect(bookingPayload.appointment.status).toBe("pending");

    const confirmation = await PATCH(
      new Request("http://localhost/api/appointments", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-doctor-pin": "1234",
        },
        body: JSON.stringify({
          action: "confirm",
          appointmentId: bookingPayload.appointment.id,
        }),
      }),
    );
    const payload = (await confirmation.json()) as {
      appointment: { id: string; status: string };
      appointments: Array<{ id: string; status: string }>;
    };

    expect(confirmation.status).toBe(200);
    expect(payload.appointment).toMatchObject({
      id: bookingPayload.appointment.id,
      status: "confirmed",
    });
    expect(payload.appointments).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: bookingPayload.appointment.id,
          status: "confirmed",
        }),
      ]),
    );
  });

  it("uses patient details supplied by the public booking flow", async () => {
    resetDemoAppointmentStore();

    const response = await POST(
      new Request("http://localhost/api/appointments", {
        method: "POST",
        body: JSON.stringify({
          patientName: "María López",
          patientEmail: "maria@example.com",
          patientPhone: "611 222 333",
          slot: {
            date: "2026-06-01",
            time: "11:00",
            therapistId: "marta",
            treatmentId: "general",
          },
        }),
      }),
    );
    const payload = (await response.json()) as {
      appointment: {
        patientName: string;
        patientEmail: string;
        patientPhone: string;
      };
    };

    expect(payload.appointment).toMatchObject({
      patientName: "María López",
      patientEmail: "maria@example.com",
      patientPhone: "611 222 333",
    });
  });

  it("lets the private doctor modify appointment details", async () => {
    resetDemoAppointmentStore();

    const response = await PATCH(
      new Request("http://localhost/api/appointments", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-doctor-pin": "1234",
        },
        body: JSON.stringify({
          action: "move",
          appointmentId: "apt-demo-1",
          slot: {
            date: "2026-06-03",
            time: "16:00",
            therapistId: "alvaro",
            treatmentId: "postural",
            notes: "Cambio solicitado desde el panel medico.",
          },
        }),
      }),
    );
    const payload = (await response.json()) as {
      appointments: Array<{
        id: string;
        date: string;
        time: string;
        therapistId: string;
        treatmentId: string;
        notes?: string;
      }>;
    };

    expect(response.status).toBe(200);
    expect(payload.appointments).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "apt-demo-1",
          date: "2026-06-03",
          time: "16:00",
          therapistId: "alvaro",
          treatmentId: "postural",
          notes: "Cambio solicitado desde el panel medico.",
        }),
      ]),
    );
  });

  it("lets the private doctor create a confirmed manual appointment", async () => {
    resetDemoAppointmentStore();

    const response = await PATCH(
      new Request("http://localhost/api/appointments", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-doctor-pin": "1234",
        },
        body: JSON.stringify({
          action: "create_manual",
          appointment: {
            patientName: "Paciente Manual",
            patientEmail: "manual@example.com",
            patientPhone: "600 123 123",
            treatmentId: "general",
            therapistId: "marta",
            date: "2026-06-04",
            time: "18:00",
            notes: "Cita creada desde el panel privado.",
            wantsEarlier: true,
          },
        }),
      }),
    );
    const payload = (await response.json()) as {
      appointment: {
        patientName: string;
        status: string;
        wantsEarlier?: boolean;
      };
      appointments: Array<{ patientName: string; status: string }>;
    };

    expect(response.status).toBe(200);
    expect(payload.appointment).toMatchObject({
      patientName: "Paciente Manual",
      status: "confirmed",
      wantsEarlier: true,
    });
    expect(payload.appointments).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          patientName: "Paciente Manual",
          status: "confirmed",
        }),
      ]),
    );
  });

  it("lets a verified patient cancel their appointment from chat", async () => {
    resetDemoAppointmentStore();

    const response = await PATCH(
      new Request("http://localhost/api/appointments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "patient_cancel",
          patientEmail: "laura@example.com",
          patientPhone: "600111222",
        }),
      }),
    );
    const payload = (await response.json()) as {
      appointment: { id: string; status: string };
    };

    expect(response.status).toBe(200);
    expect(payload.appointment).toMatchObject({
      id: "apt-demo-1",
      status: "cancelled",
    });
  });

  it("returns slots for a verified patient appointment change", async () => {
    resetDemoAppointmentStore();

    const response = await PATCH(
      new Request("http://localhost/api/appointments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "patient_lookup",
          operation: "modify",
          patientEmail: "laura@example.com",
          patientPhone: "600 111 222",
          requestedDate: "2026-06-04",
        }),
      }),
    );
    const payload = (await response.json()) as {
      appointment: { id: string };
      slots: Array<{ date: string; therapistId: string }>;
    };

    expect(response.status).toBe(200);
    expect(payload.appointment.id).toBe("apt-demo-1");
    expect(payload.slots.length).toBeGreaterThan(0);
    expect(payload.slots.every((slot) => slot.date === "2026-06-04")).toBe(
      true,
    );
  });

  it("lets a verified patient move their appointment from chat", async () => {
    resetDemoAppointmentStore();

    const response = await PATCH(
      new Request("http://localhost/api/appointments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "patient_move",
          appointmentId: "apt-demo-1",
          patientEmail: "laura@example.com",
          patientPhone: "600 111 222",
          slot: {
            date: "2026-06-03",
            time: "16:00",
            therapistId: "alvaro",
            treatmentId: "sports",
          },
        }),
      }),
    );
    const payload = (await response.json()) as {
      appointment: {
        id: string;
        date: string;
        time: string;
        therapistId: string;
      };
    };

    expect(response.status).toBe(200);
    expect(payload.appointment).toMatchObject({
      id: "apt-demo-1",
      date: "2026-06-03",
      time: "16:00",
      therapistId: "alvaro",
    });
  });

  it("does not let a patient manage an appointment with wrong contact details", async () => {
    resetDemoAppointmentStore();

    const response = await PATCH(
      new Request("http://localhost/api/appointments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "patient_cancel",
          patientEmail: "laura@example.com",
          patientPhone: "699 999 999",
        }),
      }),
    );

    expect(response.status).toBe(404);
  });
});
