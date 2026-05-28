import { describe, expect, it } from "vitest";

import { resetDemoAppointmentStore } from "@/lib/receptionist/appointment-store";
import { seedAppointments } from "@/lib/receptionist/demo-data";

import { POST, createReceptionActionFromOpenAIIntent } from "./route";

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

  it("turns an OpenAI appointment intent into backend-controlled slots", () => {
    const action = createReceptionActionFromOpenAIIntent(
      {
        intent: "request_appointment",
        message: "Claro, te busco huecos para fisioterapia deportiva.",
        treatmentId: "sports",
      },
      seedAppointments,
    );

    expect(action.type).toBe("propose_slots");
    if (action.type === "propose_slots") {
      expect(action.message).toContain("fisioterapia deportiva");
      expect(action.slots.length).toBeGreaterThan(0);
      expect(action.slots.every((slot) => slot.treatmentId === "sports")).toBe(
        true,
      );
    }
  });
});
