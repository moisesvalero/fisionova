import { describe, expect, it } from "vitest";

import { resetDemoAppointmentStore } from "@/lib/receptionist/appointment-store";
import { createAppointmentActionToken } from "@/lib/receptionist/action-token";

import { GET } from "./route";

describe("/api/appointments/respond", () => {
  it("lets a patient confirm from a signed email link", async () => {
    resetDemoAppointmentStore();
    const token = createAppointmentActionToken("apt-demo-1", "confirm");

    const response = await GET(
      new Request(
        `http://localhost/api/appointments/respond?token=${encodeURIComponent(token)}`,
      ),
    );
    const html = await response.text();

    expect(response.status).toBe(200);
    expect(html).toContain("Cita confirmada");
  });

  it("accepts a valid signed email link even if the demo appointment store was reset elsewhere", async () => {
    resetDemoAppointmentStore();
    const token = createAppointmentActionToken(
      "apt-missing-from-memory",
      "cancel",
    );

    const response = await GET(
      new Request(
        `http://localhost/api/appointments/respond?token=${encodeURIComponent(token)}`,
      ),
    );
    const html = await response.text();

    expect(response.status).toBe(200);
    expect(html).toContain("Cita cancelada");
    expect(html).not.toContain("Cita no encontrada");
  });

  it("rejects unsigned email actions", async () => {
    const response = await GET(
      new Request("http://localhost/api/appointments/respond?token=bad"),
    );

    expect(response.status).toBe(400);
  });
});
