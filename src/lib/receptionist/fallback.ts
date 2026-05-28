import { findAvailableSlots } from "./agenda";
import { clinicProfile, treatments } from "./demo-data";
import type { Appointment, ReceptionAction } from "./types";

function normalize(input: string) {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

export function getFallbackReceptionAction(
  message: string,
  appointments: Appointment[],
): ReceptionAction {
  const text = normalize(message);

  if (
    text.includes("precio") ||
    text.includes("cuanto cuesta") ||
    text.includes("tarifa")
  ) {
    const prices = treatments
      .map((item) => `${item.name}: ${item.price} euros`)
      .join(", ");

    return {
      type: "reply",
      message: `Claro. Estas son nuestras tarifas principales: ${prices}.`,
    };
  }

  if (text.includes("horario")) {
    return {
      type: "reply",
      message: `Abrimos ${clinicProfile.openingHours}. Si quieres, puedo buscarte un hueco ahora mismo.`,
    };
  }

  if (
    text.includes("donde") ||
    text.includes("ubicacion") ||
    text.includes("direccion")
  ) {
    return {
      type: "reply",
      message: `Estamos en ${clinicProfile.address}. Tambien puedes llamarnos al ${clinicProfile.phone}.`,
    };
  }

  if (text.includes("tratamiento") || text.includes("servicio")) {
    const serviceList = treatments
      .map((item) => `${item.name}: ${item.description}`)
      .join(" ");

    return {
      type: "reply",
      message: `Trabajamos estos tratamientos: ${serviceList}`,
    };
  }

  if (text.includes("cancel")) {
    return {
      type: "reply",
      message:
        "Puedo ayudarte a cancelar una cita. Selecciona una cita en la agenda y usa cancelar; te preparo tambien el email de cancelacion.",
    };
  }

  if (
    text.includes("cita") ||
    text.includes("reserv") ||
    text.includes("hueco")
  ) {
    const treatmentId = text.includes("deport") ? "sports" : "general";
    const slots = findAvailableSlots(appointments, { treatmentId });

    return {
      type: "propose_slots",
      message:
        "Tengo estos huecos disponibles. Elige uno y te preparo la confirmacion con tus datos.",
      slots,
    };
  }

  return {
    type: "reply",
    message:
      "Soy la recepcionista virtual de FisioNova. Puedo ayudarte con citas, precios, tratamientos, horarios y ubicacion.",
  };
}
