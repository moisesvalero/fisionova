import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ReceptionistExperience } from "./receptionist-experience";

describe("ReceptionistExperience", () => {
  it("renders the AI receptionist, agenda, and email log", () => {
    render(<ReceptionistExperience />);

    expect(screen.getByText("Recepcionista IA")).toBeInTheDocument();
    expect(screen.getByText("Agenda de la clinica")).toBeInTheDocument();
    expect(screen.getByText("Emails de cita")).toBeInTheDocument();
  });
});
