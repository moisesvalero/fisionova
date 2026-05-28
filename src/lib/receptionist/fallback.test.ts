import { describe, expect, it } from "vitest";

import { seedAppointments } from "./demo-data";
import { buildAppointmentEmail } from "./email";
import { getFallbackReceptionAction } from "./fallback";

describe("fallback receptionist", () => {
  it("answers treatment prices", () => {
    const action = getFallbackReceptionAction(
      "cuanto cuesta la fisioterapia deportiva?",
      seedAppointments,
    );

    expect(action.type).toBe("reply");
    expect(action.message).toContain("50");
  });

  it("proposes slots for appointment requests", () => {
    const action = getFallbackReceptionAction(
      "quiero cita el viernes por la tarde",
      seedAppointments,
    );

    expect(action.type).toBe("propose_slots");
    if (action.type === "propose_slots") {
      expect(action.slots.length).toBeGreaterThan(0);
    }
  });

  it("builds a confirmation email", () => {
    const email = buildAppointmentEmail("confirmation", seedAppointments[0]!);

    expect(email.subject).toContain("confirmada");
    expect(email.body).toContain("Laura Gomez");
  });
});
