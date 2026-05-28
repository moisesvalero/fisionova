import { describe, expect, it } from "vitest";

import { resetDemoAppointmentStore } from "@/lib/receptionist/appointment-store";

import { GET, POST } from "./route";

describe("/api/appointments", () => {
  it("rejects private agenda reads without the doctor PIN", async () => {
    const response = await GET(
      new Request("http://localhost/api/appointments"),
    );

    expect(response.status).toBe(401);
  });

  it("books a public appointment and exposes it only to private reads", async () => {
    resetDemoAppointmentStore();

    const booking = await POST(
      new Request("http://localhost/api/appointments", {
        method: "POST",
        body: JSON.stringify({
          slot: {
            date: "2026-06-01",
            time: "09:30",
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
      appointments: Array<{ time: string }>;
    };

    expect(privateRead.status).toBe(200);
    expect(payload.appointments).toEqual(
      expect.arrayContaining([expect.objectContaining({ time: "09:30" })]),
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
            time: "10:30",
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
});
