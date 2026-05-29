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

  it("asks for the pain or treatment goal before proposing slots", () => {
    const action = getFallbackReceptionAction(
      "quiero cita el viernes por la tarde",
      seedAppointments,
    );

    expect(action.type).toBe("reply");
    expect(action.message).toContain("molesta");
  });

  it("proposes slots when the appointment request includes pain context", () => {
    const action = getFallbackReceptionAction(
      "quiero cita porque me duele la rodilla despues de correr",
      seedAppointments,
    );

    expect(action.type).toBe("propose_slots");
    if (action.type === "propose_slots") {
      expect(action.slots.length).toBeGreaterThan(0);
      expect(action.slots.every((slot) => slot.treatmentId === "sports")).toBe(
        true,
      );
    }
  });

  it("uses a short follow-up answer as appointment context", () => {
    const action = getFallbackReceptionAction("rodilla", seedAppointments, {
      pendingAppointmentTriage: true,
    });

    expect(action.type).toBe("propose_slots");
    if (action.type === "propose_slots") {
      expect(action.slots.every((slot) => slot.treatmentId === "sports")).toBe(
        true,
      );
    }
  });

  it("answers thanks as a closing message after a booking", () => {
    const action = getFallbackReceptionAction("gracias", seedAppointments, {
      completedBooking: true,
    });

    expect(action.type).toBe("reply");
    expect(action.message).toContain("A ti");
    expect(action.message).toContain("confirmaci");
  });

  it("discloses the portfolio demo and redirects urgent medical questions", () => {
    const action = getFallbackReceptionAction(
      "tengo dolor fuerte en el pecho y me cuesta respirar, que hago?",
      seedAppointments,
    );

    expect(action.type).toBe("reply");
    expect(action.message).toContain("demo ficticia");
    expect(action.message).toContain("urgencias");
  });

  it("builds a confirmation email", () => {
    const email = buildAppointmentEmail("confirmation", seedAppointments[0]!);

    expect(email.subject).toContain("confirmada");
    expect(email.body).toContain("moisesvalero.es");
    expect(email.html).toContain("Ver portfolio");
    expect(email.html).toContain("https://moisesvalero.es/");
    expect(email.body).toContain("Laura Gómez");
  });
});
