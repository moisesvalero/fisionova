import { findAvailableSlots } from "./agenda";
import { clinicProfile, demoDates, treatments } from "./demo-data";
import type { Appointment, ReceptionAction } from "./types";

type FallbackContext = {
  completedBooking?: boolean;
  pendingAppointmentTriage?: boolean;
  requestedDate?: string | null;
};

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

const weekdayDates: Record<string, string> = {
  lunes: "2026-06-01",
  martes: "2026-06-02",
  miercoles: "2026-06-03",
  jueves: "2026-06-04",
  viernes: "2026-06-05",
};

export function inferRequestedDate(message: string) {
  const text = normalize(message);
  const isoDate = text.match(/\b2026-06-0[1-5]\b/)?.[0] ?? null;

  if (isoDate && demoDates.includes(isoDate)) {
    return isoDate;
  }

  const shortDate = text.match(/\b0?([1-5])\/0?6(?:\/2026)?\b/);

  if (shortDate) {
    return `2026-06-0${shortDate[1]}`;
  }

  for (const [weekday, date] of Object.entries(weekdayDates)) {
    if (text.includes(weekday)) {
      return date;
    }
  }

  return null;
}

function formatRequestedDate(date?: string | null) {
  switch (date) {
    case "2026-06-01":
      return "lunes";
    case "2026-06-02":
      return "martes";
    case "2026-06-03":
      return "miércoles";
    case "2026-06-04":
      return "jueves";
    case "2026-06-05":
      return "viernes";
    default:
      return date ?? null;
  }
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

function isThanksMessage(text: string) {
  return (
    text.includes("gracias") ||
    text.includes("muchas gracias") ||
    text.includes("perfecto") ||
    text.includes("genial") ||
    text.includes("vale gracias")
  );
}

export function getFallbackReceptionAction(
  message: string,
  appointments: Appointment[],
  context: FallbackContext = {},
): ReceptionAction {
  const text = normalize(message);
  const requestedDate =
    inferRequestedDate(message) ?? context.requestedDate ?? null;

  if (isSeriousMedicalMessage(text)) {
    return {
      type: "reply",
      message:
        "Esto es una demo ficticia de portfolio y no puede valorar urgencias ni dar diagnóstico. Si tienes síntomas fuertes, dificultad para respirar, dolor en el pecho o algo que te preocupe, llama a urgencias o acude a un centro sanitario real.",
    };
  }

  if (context.completedBooking && isThanksMessage(text)) {
    return {
      type: "reply",
      message: "A ti. Recibirás la confirmación por email. Que vaya muy bien.",
    };
  }

  if (context.pendingAppointmentTriage) {
    const treatmentId = inferTreatmentId(text) ?? "general";
    const slots = findAvailableSlots(appointments, {
      treatmentId,
      date: requestedDate ?? undefined,
    });
    const requestedDateLabel = formatRequestedDate(requestedDate);

    return {
      type: "propose_slots",
      message: requestedDateLabel
        ? `Vale, con eso ya te enseño huecos para el ${requestedDateLabel}. Elige el que mejor te venga y lo dejamos apuntado.`
        : "Vale, con eso ya te enseño huecos que pueden encajar. Elige el que mejor te venga y lo dejamos apuntado.",
      slots,
      requestedDate,
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
      message: `Claro, te cuento. Las sesiones van así: ${prices}. Si me dices qué te pasa, te oriento mejor.`,
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
      message: `Trabajamos sobre todo esto: ${serviceList} Si me cuentas qué notas, te digo cuál encaja mejor.`,
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
        requestedDate,
      };
    }

    const slots = findAvailableSlots(appointments, {
      treatmentId,
      date: requestedDate ?? undefined,
    });
    const requestedDateLabel = formatRequestedDate(requestedDate);

    return {
      type: "propose_slots",
      message: requestedDateLabel
        ? `Perfecto, para el ${requestedDateLabel} tengo estos huecos. Elige el que mejor te venga y lo dejamos apuntado.`
        : "Perfecto, con lo que me cuentas estos huecos pueden encajar bien. Elige el que mejor te venga y lo dejamos apuntado.",
      slots,
      requestedDate,
    };
  }

  return {
    type: "reply",
    message:
      "Soy Clara, la recepcionista de FisioNova. Puedo ayudarte con citas, precios, tratamientos, horarios y ubicación.",
  };
}
