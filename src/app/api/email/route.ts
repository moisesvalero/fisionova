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
  status: z.enum(["pending", "confirmed", "cancelled"]),
  notes: z.string().max(500).optional(),
});

const emailRequestSchema = z.object({
  type: z.enum(["confirmation", "cancellation", "modification"]),
  appointment: appointmentSchema,
});

function isAuthorized(request: Request) {
  return request.headers.get("x-doctor-pin") === env.DOCTOR_DASHBOARD_PIN;
}

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return unauthorized();
  }

  const body = emailRequestSchema.parse(await request.json());
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
