import { describe, expect, it } from "vitest";

import { getResponsePendingToggleStatus } from "./doctor-agenda";

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
});
