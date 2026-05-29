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
    expect(payload.action.type).toBe("reply");
  });

  it("turns an OpenAI appointment intent into backend-controlled slots", () => {
    const action = createReceptionActionFromOpenAIIntent(
      {
        intent: "request_appointment",
        message: "Claro, te busco huecos para fisioterapia deportiva.",
        treatmentId: "sports",
        requestedDate: null,
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

  it("asks what the patient needs when appointment intent lacks treatment context", () => {
    const action = createReceptionActionFromOpenAIIntent(
      {
        intent: "request_appointment",
        message: "Claro, te ayudo con la cita.",
        treatmentId: null,
        requestedDate: null,
      },
      seedAppointments,
    );

    expect(action.type).toBe("reply");
    expect(action.message).toContain("molesta");
  });

  it("uses the local appointment context to propose slots after one follow-up", async () => {
    resetDemoAppointmentStore();

    const response = await POST(
      new Request("http://localhost/api/receptionist", {
        method: "POST",
        body: JSON.stringify({
          message: "rodilla",
          context: { pendingAppointmentTriage: true },
        }),
      }),
    );
    const payload = (await response.json()) as {
      provider: string;
      action: { type: string; slots?: Array<{ treatmentId: string }> };
    };

    expect(payload.provider).toBe("fallback");
    expect(payload.action.type).toBe("propose_slots");
    expect(
      payload.action.slots?.every((slot) => slot.treatmentId === "sports"),
    ).toBe(true);
  });

  it("keeps the requested weekday after the treatment follow-up", async () => {
    resetDemoAppointmentStore();

    const response = await POST(
      new Request("http://localhost/api/receptionist", {
        method: "POST",
        body: JSON.stringify({
          message: "rodilla",
          context: {
            pendingAppointmentTriage: true,
            requestedDate: "2026-06-04",
          },
        }),
      }),
    );
    const payload = (await response.json()) as {
      provider: string;
      action: {
        type: string;
        requestedDate?: string | null;
        slots?: Array<{ date: string; treatmentId: string }>;
      };
    };

    expect(payload.provider).toBe("fallback");
    expect(payload.action.type).toBe("propose_slots");
    expect(payload.action.requestedDate).toBe("2026-06-04");
    expect(
      payload.action.slots?.every((slot) => slot.date === "2026-06-04"),
    ).toBe(true);
  });

  it("turns an OpenAI weekday intent into slots for that day", () => {
    const action = createReceptionActionFromOpenAIIntent(
      {
        intent: "request_appointment",
        message: "Claro, te busco huecos para el jueves.",
        treatmentId: "sports",
        requestedDate: "2026-06-04",
      },
      seedAppointments,
    );

    expect(action.type).toBe("propose_slots");
    if (action.type === "propose_slots") {
      expect(action.requestedDate).toBe("2026-06-04");
      expect(action.slots.every((slot) => slot.date === "2026-06-04")).toBe(
        true,
      );
    }
  });

  it("keeps serious medical advice inside a demo safety boundary", () => {
    const action = createReceptionActionFromOpenAIIntent(
      {
        intent: "reply",
        message:
          "Esto es una demo ficticia de portfolio. Si tienes dolor fuerte en el pecho o te cuesta respirar, llama a urgencias o acude a un centro sanitario real.",
        treatmentId: null,
        requestedDate: null,
      },
      seedAppointments,
    );

    expect(action.type).toBe("reply");
    expect(action.message).toContain("demo ficticia");
    expect(action.message).toContain("urgencias");
  });
});
