import { describe, expect, it } from "vitest";

import {
  didAppointmentFreeSlot,
  getResponsePendingToggleStatus,
} from "./doctor-agenda";

describe("doctor agenda response pending toggle", () => {
  it("marks a normal appointment as awaiting response", () => {
    expect(getResponsePendingToggleStatus("confirmed")).toBe(
      "awaiting_response",
    );
  });

  it("returns an awaiting response appointment to confirmed", () => {
    expect(getResponsePendingToggleStatus("awaiting_response")).toBe(
      "confirmed",
    );
  });

  it("detects when editing an appointment frees its old calendar slot", () => {
    expect(
      didAppointmentFreeSlot(
        { date: "2026-06-01", time: "10:00", therapistId: "marta" },
        { date: "2026-06-01", time: "11:00", therapistId: "marta" },
      ),
    ).toBe(true);
  });
});
