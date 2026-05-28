import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ReceptionistExperience } from "./receptionist-experience";

describe("ReceptionistExperience", () => {
  it("renders the public clinic page without exposing the private agenda", () => {
    render(<ReceptionistExperience />);

    expect(screen.getByText("moverte sin dolor")).toBeInTheDocument();
    expect(screen.getAllByText("Recepción online").length).toBeGreaterThan(0);
    expect(screen.queryByText("Agenda privada")).not.toBeInTheDocument();
    expect(screen.queryByText("Agenda de la clínica")).not.toBeInTheDocument();
    expect(screen.queryByText("Laura Gómez")).not.toBeInTheDocument();
  });
});
