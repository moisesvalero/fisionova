import { NextResponse } from "next/server";
import { z } from "zod";

import { env } from "@/lib/env";
import { checkRateLimit, getClientKey } from "@/lib/rate-limit";
import { getDemoAppointments } from "@/lib/receptionist/appointment-store";
import { findAvailableSlots } from "@/lib/receptionist/agenda";
import { clinicProfile, treatments } from "@/lib/receptionist/demo-data";
import { getFallbackReceptionAction } from "@/lib/receptionist/fallback";
import type { Appointment, ReceptionAction } from "@/lib/receptionist/types";

const receptionRequestSchema = z.object({
  message: z.string().trim().min(1).max(700),
});

const openAIIntentSchema = z.object({
  intent: z.enum(["reply", "request_appointment"]),
  message: z.string().min(1),
  treatmentId: z.enum(["general", "sports", "postural"]).nullable(),
});

export type OpenAIReceptionIntent = z.infer<typeof openAIIntentSchema>;

type OpenAIResponse = {
  output_text?: string;
  output?: Array<{
    content?: Array<{
      text?: string;
      type?: string;
    }>;
  }>;
};

const openAIReceptionIntentJsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    intent: {
      type: "string",
      enum: ["reply", "request_appointment"],
      description:
        "Use request_appointment when the patient wants to book or find an appointment slot. Use reply for prices, address, opening hours, treatment questions, cancellation explanations, or general help.",
    },
    message: {
      type: "string",
      description:
        "Short, warm Spanish message for the patient. Do not invent booked appointments. If intent is request_appointment, do not ask for another day unless the user did not mention any scheduling preference.",
    },
    treatmentId: {
      type: ["string", "null"],
      enum: ["general", "sports", "postural", null],
      description:
        "Best matching treatment. Use sports for deportiva/deporte/lesiones deportivas/rodilla/tobillo/correr, postural for postura/espalda/cuello/higiene postural, general for pain, massage or physiotherapy needs that do not fit those two. Use null when the patient asks for an appointment but has not explained what hurts or what they want to treat.",
    },
  },
  required: ["intent", "message", "treatmentId"],
};

function getOpenAIText(data: OpenAIResponse) {
  if (data.output_text) {
    return data.output_text;
  }

  return data.output
    ?.flatMap((item) => item.content ?? [])
    .map((content) => content.text)
    .find(Boolean);
}

function parseOpenAIIntent(data: OpenAIResponse) {
  const text = getOpenAIText(data);

  if (!text) {
    return null;
  }

  return openAIIntentSchema.parse(JSON.parse(text) as unknown);
}

function buildReceptionSystemPrompt() {
  const treatmentSummary = treatments
    .map(
      (treatment) =>
        `${treatment.id}: ${treatment.name}, ${treatment.durationMinutes} min, ${treatment.price} euros. ${treatment.description}`,
    )
    .join("\n");

  return [
    "Eres Clara, la recepcionista online de FisioNova Clínica, una clínica de fisioterapia cercana y profesional.",
    "Responde siempre en español, con tono cálido, breve y natural. Suenas como Clara: una recepcionista de barrio muy simpática, cercana, amable y resolutiva, sin tecnicismos.",
    "No uses palabras internas como solicitud, estado pendiente, backend, sistema, base de datos o proceso administrativo cuando hables con el paciente.",
    "No digas que eres un modelo de IA. Hablas como Clara, la recepcionista de la clínica.",
    "Si el paciente pide diagnóstico, medicación, valoración médica, habla de urgencias o cuenta síntomas serios como dolor fuerte en el pecho, dificultad para respirar, fiebre, desmayo, embarazo con dolor, pérdida de fuerza o algo parecido, responde que esto es una demo ficticia de portfolio y que debe contactar con urgencias o un profesional sanitario real. No des consejos médicos.",
    "No confirmes una cita directamente. Si el paciente quiere reservar, marca request_appointment. Si no ha contado qué le duele o qué quiere tratar, deja treatmentId en null para preguntarlo antes de mostrar huecos.",
    "Si el paciente pide cita para hoy, no preguntes 'quÃ© dÃ­a de hoy'. Pide sÃ³lo la franja si falta, o deja que el backend proponga huecos.",
    "No muestres la agenda interna ni datos de otros pacientes.",
    `Dirección: ${clinicProfile.address}. Teléfono: ${clinicProfile.phone}. Horario: ${clinicProfile.openingHours}.`,
    `Tratamientos:\n${treatmentSummary}`,
  ].join("\n");
}

export function createReceptionActionFromOpenAIIntent(
  intent: OpenAIReceptionIntent,
  appointments: Appointment[],
): ReceptionAction {
  if (intent.intent === "reply") {
    return {
      type: "reply",
      message: intent.message,
    };
  }

  if (!intent.treatmentId) {
    return {
      type: "reply",
      message:
        "Claro, te ayudo. Antes de mirar hora, cuéntame qué te molesta o qué quieres tratar.",
    };
  }

  const slots = findAvailableSlots(appointments, {
    treatmentId: intent.treatmentId,
  });

  if (slots.length === 0) {
    return {
      type: "reply",
      message:
        "Ahora mismo no veo huecos libres para ese tratamiento. Prueba con otra franja y te digo qué opciones tenemos.",
    };
  }

  return {
    type: "propose_slots",
    message:
      intent.treatmentId === "sports"
        ? "Claro. Para fisioterapia deportiva, estos huecos nos encajan bien. Elige el que mejor te venga y lo dejamos apuntado para confirmártelo por email."
        : intent.treatmentId === "postural"
          ? "Claro. Para reeducación postural, estos huecos nos encajan bien. Elige el que mejor te venga y lo dejamos apuntado para confirmártelo por email."
          : "Claro. Estos huecos nos encajan bien. Elige el que mejor te venga y lo dejamos apuntado para confirmártelo por email.",
    slots,
  };
}

export async function POST(request: Request) {
  const rateLimit = checkRateLimit(getClientKey(request, "receptionist"), {
    limit: 20,
    windowMs: 60_000,
  });

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many requests" },
      {
        status: 429,
        headers: { "Retry-After": String(rateLimit.retryAfter) },
      },
    );
  }

  const body = receptionRequestSchema.parse(await request.json());
  const appointments = getDemoAppointments();
  const fallback = getFallbackReceptionAction(body.message, appointments);

  if (!env.OPENAI_API_KEY) {
    return NextResponse.json({
      provider: "fallback",
      action: fallback,
    });
  }

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: env.OPENAI_MODEL,
        text: {
          format: {
            type: "json_schema",
            name: "reception_intent",
            strict: true,
            schema: openAIReceptionIntentJsonSchema,
          },
        },
        input: [
          {
            role: "system",
            content: buildReceptionSystemPrompt(),
          },
          {
            role: "user",
            content: body.message,
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI request failed: ${response.status}`);
    }

    const data = (await response.json()) as OpenAIResponse;
    const intent = parseOpenAIIntent(data);
    const action = intent
      ? createReceptionActionFromOpenAIIntent(intent, appointments)
      : fallback;

    return NextResponse.json({
      provider: "openai",
      action,
    });
  } catch {
    return NextResponse.json({
      provider: "fallback",
      action: fallback,
    });
  }
}
