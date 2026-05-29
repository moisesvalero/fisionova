import { NextResponse } from "next/server";
import { z } from "zod";

import { env } from "@/lib/env";
import { buildAppointmentEmail } from "@/lib/receptionist/email";

const appointmentSchema = z.object({
  id: z.string().min(1).max(120),
  patientName: z.string().min(1).max(120),
  patientEmail: z.email().max(254),
  patientPhone: z.string().min(1).max(40),
  treatmentId: z.string().min(1).max(80),
  therapistId: z.string().min(1).max(80),
  date: z.string().min(1).max(20),
  time: z.string().min(1).max(20),
  status: z.enum([
    "pending",
    "awaiting_response",
    "confirmed",
    "patient_confirmed",
    "reschedule_proposed",
    "payment_pending",
    "cancelled",
    "no_show",
    "completed",
    "blocked",
  ]),
  notes: z.string().max(500).optional(),
});

const emailRequestSchema = z.object({
  type: z.enum([
    "confirmation",
    "cancellation",
    "modification",
    "reminder",
    "reschedule_proposal",
    "waitlist_offer",
  ]),
  appointment: appointmentSchema,
});

function isAuthorized(request: Request) {
  return request.headers.get("x-doctor-pin") === env.DOCTOR_DASHBOARD_PIN;
}

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

function formatSender(email: string) {
  return `FisioNova <${email}>`;
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return unauthorized();
  }

  const body = emailRequestSchema.parse(await request.json());
  const email = buildAppointmentEmail(body.type, body.appointment);
  const recipient = env.RESEND_TEST_RECIPIENT ?? body.appointment.patientEmail;
  const emailBody = env.RESEND_TEST_RECIPIENT
    ? `${email.body}\n\n[Demo] Destinatario original: ${body.appointment.patientEmail}`
    : email.body;
  const emailHtml = env.RESEND_TEST_RECIPIENT
    ? email.html.replace(
        "</body>",
        `<p style="font-family:Arial,Helvetica,sans-serif;color:#69756f;font-size:12px;text-align:center;">Destinatario original: ${body.appointment.patientEmail}</p></body>`,
      )
    : email.html;

  if (!env.RESEND_API_KEY || !env.RESEND_FROM_EMAIL) {
    return NextResponse.json({
      status: "simulated",
      email,
      recipient: body.appointment.patientEmail,
    });
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
      "Idempotency-Key": `${body.type}-${body.appointment.id}`,
      "User-Agent": "FisioNova-Appointment-Emails/1.0",
    },
    body: JSON.stringify({
      from: formatSender(env.RESEND_FROM_EMAIL),
      to: recipient,
      reply_to: env.RESEND_REPLY_TO_EMAIL ?? env.RESEND_FROM_EMAIL,
      subject: email.subject,
      text: emailBody,
      html: emailHtml,
      headers: {
        "X-Entity-Ref-ID": `${body.type}-${body.appointment.id}`,
        "X-Auto-Response-Suppress": "All",
      },
      tags: [
        {
          name: "category",
          value: "appointment",
        },
        {
          name: "event",
          value: body.type,
        },
      ],
    }),
  });

  if (!response.ok) {
    const error = (await response.json().catch(() => null)) as {
      message?: string;
    } | null;

    return NextResponse.json(
      {
        status: "failed",
        email,
        recipient,
        error: error?.message ?? "Resend rejected the email request.",
      },
      { status: 200 },
    );
  }

  return NextResponse.json({ status: "sent", email, recipient });
}
