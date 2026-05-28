import { describe, expect, it } from "vitest";

import { seedAppointments } from "@/lib/receptionist/demo-data";

import { POST } from "./route";

describe("/api/receptionist", () => {
  it("uses the local fallback when OpenAI is not configured", async () => {
    const response = await POST(
      new Request("http://localhost/api/receptionist", {
        method: "POST",
        body: JSON.stringify({
          message: "quiero cita",
          appointments: seedAppointments,
        }),
      }),
    );

    const payload = (await response.json()) as {
      provider: string;
      action: { type: string };
    };

    expect(payload.provider).toBe("fallback");
    expect(payload.action.type).toBe("propose_slots");
  });
});
