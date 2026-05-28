import { NextResponse } from "next/server";

import { env } from "@/lib/env";
import { getDemoAppointments } from "@/lib/receptionist/appointment-store";
import { getFallbackReceptionAction } from "@/lib/receptionist/fallback";
import type { ReceptionAction } from "@/lib/receptionist/types";

type ReceptionRequest = {
  message: string;
};

type OpenAIResponse = {
  output_text?: string;
  output?: Array<{
    content?: Array<{
      text?: string;
      type?: string;
    }>;
  }>;
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
        input: [
          {
            role: "system",
            content:
              "Eres una recepcionista cálida de una clínica de fisioterapia. Responde breve, en español, y pide solo los datos necesarios. Si el usuario quiere cita, ayúdale a elegir un hueco de la agenda disponible de la app.",
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
    const message = getOpenAIText(data);
    const action: ReceptionAction = message
      ? { type: "reply", message }
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
