import { NextResponse } from "next/server";
import { z } from "zod";

import { env } from "@/lib/env";
import { checkRateLimit, getClientKey } from "@/lib/rate-limit";
import { listAppointments } from "@/lib/receptionist/appointment-repository";
import { findAvailableSlots } from "@/lib/receptionist/agenda";
import { clinicProfile, treatments } from "@/lib/receptionist/demo-data";
import {
  getFallbackReceptionAction,
  inferRequestedDate,
} from "@/lib/receptionist/fallback";
import type { Appointment, ReceptionAction } from "@/lib/receptionist/types";

const receptionRequestSchema = z.object({
  message: z.string().trim().min(1).max(700),
  context: z
    .object({
      completedBooking: z.boolean().optional(),
      hasPendingSlotProposal: z.boolean().optional(),
      pendingAppointmentTriage: z.boolean().optional(),
      pendingTreatmentId: z
        .enum(["general", "sports", "postural"])
        .nullable()
        .optional(),
      requestedDate: z.string().nullable().optional(),
    })
    .optional(),
});

const openAIIntentSchema = z.object({
  intent: z.enum([
    "reply",
    "request_appointment",
    "cancel_appointment",
    "modify_appointment",
  ]),
  message: z.string().min(1),
  treatmentId: z.enum(["general", "sports", "postural"]).nullable(),
  requestedDate: z.string().nullable(),
});

export type OpenAIReceptionIntent = z.infer<typeof openAIIntentSchema>;

type OpenRouterResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
  error?: {
    message?: string;
  };
};

type GeminiResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
  error?: {
    message?: string;
  };
};

const openAIReceptionIntentJsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    intent: {
      type: "string",
      enum: [
        "reply",
        "request_appointment",
        "cancel_appointment",
        "modify_appointment",
      ],
      description:
        "Use request_appointment when the patient wants to book or find an appointment slot. Use cancel_appointment when they want to cancel/anular a booked appointment. Use modify_appointment when they want to change/move/reprogramar a booked appointment. Use reply for prices, address, opening hours, treatment questions, cancellation explanations, or general help.",
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
    requestedDate: {
      type: ["string", "null"],
      enum: [
        "2026-06-01",
        "2026-06-02",
        "2026-06-03",
        "2026-06-04",
        "2026-06-05",
        null,
      ],
      description:
        "Requested appointment date in YYYY-MM-DD when the patient says lunes, martes, miércoles, jueves, viernes, a concrete date, or próximo + weekday. Use null when no day is requested.",
    },
  },
  required: ["intent", "message", "treatmentId", "requestedDate"],
};

const geminiReceptionIntentSchema = {
  type: "OBJECT",
  properties: {
    intent: {
      type: "STRING",
      enum: [
        "reply",
        "request_appointment",
        "cancel_appointment",
        "modify_appointment",
      ],
      description:
        "Use request_appointment when the patient wants to book or find an appointment slot. Use cancel_appointment when they want to cancel/anular a booked appointment. Use modify_appointment when they want to change/move/reprogramar a booked appointment. Use reply for prices, address, opening hours, treatment questions, cancellation explanations, or general help.",
    },
    message: {
      type: "STRING",
      description:
        "Short, warm Spanish message for the patient. Do not invent booked appointments. If intent is request_appointment, do not ask for another day unless the user did not mention any scheduling preference.",
    },
    treatmentId: {
      type: "STRING",
      enum: ["general", "sports", "postural"],
      nullable: true,
      description:
        "Best matching treatment. Use sports for deportiva/deporte/lesiones deportivas/rodilla/tobillo/correr, postural for postura/espalda/cuello/higiene postural, general for pain, massage or physiotherapy needs that do not fit those two. Use null when the patient asks for an appointment but has not explained what hurts or what they want to treat.",
    },
    requestedDate: {
      type: "STRING",
      enum: [
        "2026-06-01",
        "2026-06-02",
        "2026-06-03",
        "2026-06-04",
        "2026-06-05",
      ],
      nullable: true,
      description:
        "Requested appointment date in YYYY-MM-DD when the patient says lunes, martes, miércoles, jueves, viernes, a concrete date, or próximo + weekday. Use null when no day is requested.",
    },
  },
  required: ["intent", "message", "treatmentId", "requestedDate"],
};

function buildReceptionSystemPrompt() {
  const treatmentSummary = treatments
    .map(
      (treatment) =>
        `${treatment.id}: ${treatment.name}, ${treatment.durationMinutes} min, ${treatment.price} euros. ${treatment.description}`,
    )
    .join("\n");

  return [
    "Eres Virgi, la recepcionista online de FisioNova Clínica, una clínica de fisioterapia cercana y profesional.",
    "Responde siempre en español, con tono cálido, breve y natural. Suenas como Virgi: una recepcionista de barrio muy simpática, cercana, amable y resolutiva, sin tecnicismos.",
    "No uses palabras internas como solicitud, estado pendiente, backend, sistema, base de datos o proceso administrativo cuando hables con el paciente.",
    "No digas que eres un modelo de IA. Hablas como Virgi, la recepcionista de la clínica.",
    "Si el paciente pide diagnóstico, medicación, valoración médica, habla de urgencias o cuenta síntomas serios como dolor fuerte en el pecho, dificultad para respirar, fiebre, desmayo, embarazo con dolor, pérdida de fuerza o algo parecido, responde que esto es una demo ficticia de portfolio y que debe contactar con urgencias o un profesional sanitario real. No des consejos médicos.",
    "No confirmes una cita directamente. Si el paciente quiere reservar, marca request_appointment. Es OBLIGATORIO que dejes treatmentId en null si el paciente NO ha explicado específicamente qué le molesta, qué síntoma tiene o qué tratamiento quiere. No asumas ni infieras 'general' a menos que el usuario mencione explícitamente dolores musculares, necesidad de masaje o fisioterapia general. Si solo dice 'quiero cita', 'hola', 'reservar', etc. debes dejar treatmentId en null para preguntárselo primero.",
    "Si el paciente pide cita para hoy, no preguntes 'quÃ© dÃ­a de hoy'. Pide sÃ³lo la franja si falta, o deja que el backend proponga huecos.",
    "Si el paciente quiere cambiar, modificar, mover, reprogramar, anular o cancelar una cita existente, no le mandes al panel medico. Marca cancel_appointment o modify_appointment para que el sistema verifique email y telefono.",
    "No muestres la agenda interna ni datos de otros pacientes.",
    "Calendario demo disponible para reservar: lunes 2026-06-01, martes 2026-06-02, miércoles 2026-06-03, jueves 2026-06-04 y viernes 2026-06-05. Si el paciente dice 'próximo jueves', requestedDate debe ser 2026-06-04.",
    `Dirección: ${clinicProfile.address}. Teléfono: ${clinicProfile.phone}. Horario: ${clinicProfile.openingHours}.`,
    `Tratamientos:\n${treatmentSummary}`,
  ].join("\n");
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
      return null;
  }
}

export function createReceptionActionFromOpenAIIntent(
  intent: OpenAIReceptionIntent,
  appointments: Appointment[],
): ReceptionAction {
  const requestedDate = intent.requestedDate ?? null;

  if (intent.intent === "reply") {
    return {
      type: "reply",
      message: intent.message,
      requestedDate,
    };
  }

  if (
    intent.intent === "cancel_appointment" ||
    intent.intent === "modify_appointment"
  ) {
    const operation =
      intent.intent === "cancel_appointment" ? "cancel" : "modify";

    return {
      type: "request_manage_booking",
      operation,
      requestedDate,
      message:
        operation === "cancel"
          ? "Claro, te ayudo a anularla. Pásame el email y el teléfono con los que reservaste para localizar tu cita."
          : "Claro, te ayudo a cambiarla. Pásame el email y el teléfono con los que reservaste y miro tu cita.",
    };
  }

  if (!intent.treatmentId) {
    return {
      type: "reply",
      message:
        "Claro, te ayudo. Antes de mirar hora, cuéntame qué te molesta o qué quieres tratar.",
      requestedDate,
    };
  }

  const slots = findAvailableSlots(appointments, {
    treatmentId: intent.treatmentId,
    date: requestedDate ?? undefined,
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
    message: [
      intent.treatmentId === "sports"
        ? "Claro. Para fisioterapia deportiva"
        : intent.treatmentId === "postural"
          ? "Claro. Para reeducación postural"
          : "Claro",
      formatRequestedDate(requestedDate)
        ? `tengo estos huecos para el ${formatRequestedDate(requestedDate)}.`
        : "estos huecos nos encajan bien.",
      "Elige el que mejor te venga y lo dejamos apuntado para confirmártelo por email.",
    ].join(" "),
    slots,
    requestedDate,
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
  const appointments = await listAppointments();
  const requestedDate =
    inferRequestedDate(body.message) ?? body.context?.requestedDate ?? null;
  const fallback = getFallbackReceptionAction(body.message, appointments, {
    ...body.context,
    requestedDate,
  });

  if (!env.OPENROUTER_API_KEY && !env.GEMINI_API_KEY) {
    return NextResponse.json({
      provider: "fallback",
      action: fallback,
    });
  }

  const systemPrompt = [
    buildReceptionSystemPrompt(),
    body.context?.pendingAppointmentTriage
      ? "Contexto: el paciente ya pidió cita y Virgi ya le preguntó una vez qué le molesta. Interpreta este mensaje como respuesta corta a esa pregunta y, si hay cualquier pista mínima, usa request_appointment. No hagas otra pregunta de triaje."
      : "",
    body.context?.hasPendingSlotProposal && body.context?.pendingTreatmentId
      ? `Contexto: Virgi ya propuso huecos para el tratamiento ${body.context.pendingTreatmentId}. Si el paciente pide cambiar esa propuesta, otra hora u otro día, usa request_appointment con ese mismo treatmentId. No vuelvas a preguntar qué le pasa.`
      : "",
    requestedDate
      ? `Contexto: el paciente pidió la cita para ${requestedDate}. Mantén esa fecha aunque ahora solo responda qué le duele.`
      : "",
    body.context?.completedBooking
      ? "Contexto: el paciente acaba de dejar una cita apuntada. Si da las gracias o cierra la conversación, responde con una despedida breve y natural. No reinicies la conversación."
      : "",
  ]
    .filter(Boolean)
    .join("\n");

  // 1. Intentar llamar a OpenRouter
  if (env.OPENROUTER_API_KEY) {
    try {
      const response = await fetch(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
            "Content-Type": "application/json",
            "HTTP-Referer": env.NEXT_PUBLIC_APP_URL,
            "X-Title": "FisioNova Recepcionista",
          },
          body: JSON.stringify({
            model: env.OPENROUTER_MODEL,
            messages: [
              {
                role: "system",
                content: systemPrompt,
              },
              {
                role: "user",
                content: body.message,
              },
            ],
            response_format: {
              type: "json_schema",
              json_schema: {
                name: "reception_intent",
                strict: true,
                schema: openAIReceptionIntentJsonSchema,
              },
            },
          }),
        },
      );

      if (response.ok) {
        const data = (await response.json()) as OpenRouterResponse;
        const text = data.choices?.[0]?.message?.content;
        if (text) {
          const intent = openAIIntentSchema.parse(JSON.parse(text) as unknown);
          const pendingTreatmentId = body.context?.pendingTreatmentId ?? null;
          const shouldReuseProposedTreatment = Boolean(
            body.context?.hasPendingSlotProposal &&
            pendingTreatmentId &&
            (intent.intent === "modify_appointment" ||
              (intent.intent === "request_appointment" && !intent.treatmentId)),
          );
          const datedIntent = {
            ...intent,
            intent: shouldReuseProposedTreatment
              ? ("request_appointment" as const)
              : intent.intent,
            treatmentId:
              intent.treatmentId ??
              (shouldReuseProposedTreatment ? pendingTreatmentId : null),
            requestedDate: requestedDate ?? intent.requestedDate,
          };
          const action = createReceptionActionFromOpenAIIntent(
            datedIntent,
            appointments,
          );

          return NextResponse.json({
            provider: "openrouter",
            action,
          });
        }
      }
      console.warn(
        `OpenRouter API failed with status ${response.status}. Falling back to Gemini...`,
      );
    } catch (err) {
      console.warn("OpenRouter API error, falling back to Gemini...", err);
    }
  }

  // 2. Fallback a Gemini API
  if (env.GEMINI_API_KEY) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${env.GEMINI_MODEL}:generateContent?key=${env.GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [
              {
                role: "user",
                parts: [
                  {
                    text: body.message,
                  },
                ],
              },
            ],
            systemInstruction: {
              parts: [
                {
                  text: systemPrompt,
                },
              ],
            },
            generationConfig: {
              responseMimeType: "application/json",
              responseSchema: geminiReceptionIntentSchema,
            },
          }),
        },
      );

      if (response.ok) {
        const data = (await response.json()) as GeminiResponse;
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          const intent = openAIIntentSchema.parse(JSON.parse(text) as unknown);
          const pendingTreatmentId = body.context?.pendingTreatmentId ?? null;
          const shouldReuseProposedTreatment = Boolean(
            body.context?.hasPendingSlotProposal &&
            pendingTreatmentId &&
            (intent.intent === "modify_appointment" ||
              (intent.intent === "request_appointment" && !intent.treatmentId)),
          );
          const datedIntent = {
            ...intent,
            intent: shouldReuseProposedTreatment
              ? ("request_appointment" as const)
              : intent.intent,
            treatmentId:
              intent.treatmentId ??
              (shouldReuseProposedTreatment ? pendingTreatmentId : null),
            requestedDate: requestedDate ?? intent.requestedDate,
          };
          const action = createReceptionActionFromOpenAIIntent(
            datedIntent,
            appointments,
          );

          return NextResponse.json({
            provider: "gemini",
            action,
          });
        }
      }
      console.warn(
        `Gemini API failed with status ${response.status}. Falling back to local rules...`,
      );
    } catch (err) {
      console.warn("Gemini API error, falling back to local rules...", err);
    }
  }

  // 3. Fallback a reglas locales
  return NextResponse.json({
    provider: "fallback",
    action: fallback,
  });
}
