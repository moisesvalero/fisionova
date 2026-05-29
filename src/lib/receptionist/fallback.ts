import { findAvailableSlots } from "./agenda";
import { clinicProfile, treatments } from "./demo-data";
import type { Appointment, ReceptionAction } from "./types";

function normalize(input: string) {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

function inferTreatmentId(text: string) {
  if (
    text.includes("deport") ||
    text.includes("correr") ||
    text.includes("rodilla") ||
    text.includes("tobillo") ||
    text.includes("lesion")
  ) {
    return "sports";
  }

  if (
    text.includes("postura") ||
    text.includes("espalda") ||
    text.includes("cuello") ||
    text.includes("cervical") ||
    text.includes("lumbar")
  ) {
    return "postural";
  }

  if (
    text.includes("dolor") ||
    text.includes("molest") ||
    text.includes("contractura") ||
    text.includes("fisio") ||
    text.includes("masaje")
  ) {
    return "general";
  }

  return null;
}

function isSeriousMedicalMessage(text: string) {
  return (
    text.includes("pecho") ||
    text.includes("respirar") ||
    text.includes("urgencia") ||
    text.includes("emergencia") ||
    text.includes("desmayo") ||
    text.includes("fiebre") ||
    text.includes("embaraz") ||
    text.includes("medic") ||
    text.includes("diagnost") ||
    text.includes("perdida de fuerza") ||
    text.includes("no puedo mover") ||
    text.includes("dolor fuerte")
  );
}

export function getFallbackReceptionAction(
  message: string,
  appointments: Appointment[],
): ReceptionAction {
  const text = normalize(message);

  if (isSeriousMedicalMessage(text)) {
    return {
      type: "reply",
      message:
        "Esto es una demo ficticia de portfolio y no puede valorar urgencias ni dar diagnóstico. Si tienes síntomas fuertes, dificultad para respirar, dolor en el pecho o algo que te preocupe, llama a urgencias o acude a un centro sanitario real.",
    };
  }

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
      message: `Claro, te cuento. Las sesiones van as?: ${prices}. Si me dices qu? te pasa, te oriento mejor.`,
    };
  }

  if (text.includes("horario")) {
    return {
      type: "reply",
      message: `Abrimos ${clinicProfile.openingHours}. Si quieres, miro un hueco que te venga bien.`,
    };
  }

  if (
    text.includes("donde") ||
    text.includes("ubicacion") ||
    text.includes("direccion")
  ) {
    return {
      type: "reply",
      message: `Estamos en ${clinicProfile.address}. También puedes llamarnos al ${clinicProfile.phone}.`,
    };
  }

  if (text.includes("tratamiento") || text.includes("servicio")) {
    const serviceList = treatments
      .map((item) => `${item.name}: ${item.description}`)
      .join(" ");

    return {
      type: "reply",
      message: `Trabajamos sobre todo esto: ${serviceList} Si me cuentas qu? notas, te digo cu?l encaja mejor.`,
    };
  }

  if (text.includes("cancel")) {
    return {
      type: "reply",
      message:
        "Puedo ayudarte a cancelar una cita. Selecciona una cita en la agenda y usa cancelar; te preparo también el email de cancelación.",
    };
  }

  if (
    text.includes("cita") ||
    text.includes("reserv") ||
    text.includes("hueco")
  ) {
    const treatmentId = inferTreatmentId(text);

    if (!treatmentId) {
      return {
        type: "reply",
        message:
          "Claro, te ayudo. Antes de mirar hora, cuéntame qué te molesta o qué quieres tratar.",
      };
    }

    const slots = findAvailableSlots(appointments, { treatmentId });

    return {
      type: "propose_slots",
      message:
        "Perfecto, con lo que me cuentas estos huecos pueden encajar bien. Elige el que mejor te venga y lo dejamos apuntado.",
      slots,
    };
  }

  return {
    type: "reply",
    message:
      "Soy Clara, la recepcionista de FisioNova. Puedo ayudarte con citas, precios, tratamientos, horarios y ubicación.",
  };
}
