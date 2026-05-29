import { describe, expect, it } from "vitest";

import { seedAppointments } from "@/lib/receptionist/demo-data";

import { POST } from "./route";

describe("/api/email", () => {
  it("rejects email delivery without the private doctor PIN", async () => {
    const response = await POST(
      new Request("http://localhost/api/email", {
        method: "POST",
        body: JSON.stringify({
          type: "confirmation",
          appointment: seedAppointments[0],
        }),
      }),
    );

    expect(response.status).toBe(401);
  });

  it("simulates email delivery when Resend is not configured", async () => {
    const response = await POST(
      new Request("http://localhost/api/email", {
        method: "POST",
        headers: { "x-doctor-pin": "1234" },
        body: JSON.stringify({
          type: "confirmation",
          appointment: seedAppointments[0],
        }),
      }),
    );

    const payload = (await response.json()) as {
      status: string;
      email: { subject: string };
    };

    expect(payload.status).toBe("simulated");
    expect(payload.email.subject).toContain("confirmada");
  });
});
