import { NextResponse } from "next/server";
import { z } from "zod";

import { env } from "@/lib/env";
import { getDemoAppointments } from "@/lib/receptionist/appointment-store";
import { findAvailableSlots } from "@/lib/receptionist/agenda";
import { clinicProfile, treatments } from "@/lib/receptionist/demo-data";
import { getFallbackReceptionAction } from "@/lib/receptionist/fallback";
import type { Appointment, ReceptionAction } from "@/lib/receptionist/types";

type ReceptionRequest = {
  message: string;
};

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
        "Short, warm Spanish message for the patient. Do not invent booked appointments.",
    },
    treatmentId: {
      type: ["string", "null"],
      enum: ["general", "sports", "postural", null],
      description:
        "Best matching treatment. Use sports for deportiva/deporte/lesiones deportivas, postural for postura/espalda/cuello/higiene postural, general otherwise. Null if not relevant.",
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
    "Eres recepción online de FisioNova Clínica, una clínica de fisioterapia cercana y profesional.",
    "Responde siempre en español, con tono cálido, breve y natural.",
    "No digas que eres un modelo de IA. Hablas como recepción de la clínica.",
    "No confirmes una cita directamente. Si el paciente quiere reservar, marca request_appointment para que el backend proponga huecos reales.",
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

  const slots = findAvailableSlots(appointments, {
    treatmentId: intent.treatmentId ?? "general",
  });

  if (slots.length === 0) {
    return {
      type: "reply",
      message:
        "Ahora mismo no veo huecos libres para ese tratamiento. Puedes probar con otra franja o escribirnos para revisarlo manualmente.",
    };
  }

  return {
    type: "propose_slots",
    message: intent.message,
    slots,
  };
}

export async function POST(request: Request) {
  const body = (await request.json()) as ReceptionRequest;
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
