import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ReceptionistExperience } from "./receptionist-experience";

describe("ReceptionistExperience", () => {
  it("renders the AI receptionist, agenda, and email log", () => {
    render(<ReceptionistExperience />);

    expect(screen.getByText("Recepcionista IA")).toBeInTheDocument();
    expect(screen.getAllByText("Agenda de la clinica").length).toBeGreaterThan(
      0,
    );
    expect(screen.getByText("Emails de cita")).toBeInTheDocument();
  });
});
