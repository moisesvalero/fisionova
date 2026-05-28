import { NextResponse } from "next/server";

import { env } from "@/lib/env";
import { buildAppointmentEmail } from "@/lib/receptionist/email";
import type { Appointment, EmailEventType } from "@/lib/receptionist/types";

type EmailRequest = {
  type: EmailEventType;
  appointment: Appointment;
};

export async function POST(request: Request) {
  const body = (await request.json()) as EmailRequest;
  const email = buildAppointmentEmail(body.type, body.appointment);

  if (!env.RESEND_API_KEY || !env.RESEND_FROM_EMAIL) {
    return NextResponse.json({
      status: "simulated",
      email,
    });
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: env.RESEND_FROM_EMAIL,
      to: body.appointment.patientEmail,
      subject: email.subject,
      text: email.body,
    }),
  });

  if (!response.ok) {
    return NextResponse.json({ status: "failed", email }, { status: 200 });
  }

  return NextResponse.json({ status: "sent", email });
}
