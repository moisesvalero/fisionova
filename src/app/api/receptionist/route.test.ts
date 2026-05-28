import { describe, expect, it } from "vitest";

import { resetDemoAppointmentStore } from "@/lib/receptionist/appointment-store";

import { POST } from "./route";

describe("/api/receptionist", () => {
  it("uses the local fallback when OpenAI is not configured", async () => {
    resetDemoAppointmentStore();

    const response = await POST(
      new Request("http://localhost/api/receptionist", {
        method: "POST",
        body: JSON.stringify({
          message: "quiero cita",
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
