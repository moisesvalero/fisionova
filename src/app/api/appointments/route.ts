import { NextResponse } from "next/server";
import { z } from "zod";

import { env } from "@/lib/env";
import { checkRateLimit, getClientKey } from "@/lib/rate-limit";
import {
  cancelAppointmentRequest,
  confirmAppointmentRequest,
  createAppointmentRequest,
  listAppointments,
  moveAppointmentRequest,
  resetAppointments,
} from "@/lib/receptionist/appointment-repository";
import type { Appointment } from "@/lib/receptionist/types";

const slotSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^\d{2}:\d{2}$/),
  therapistId: z.string().min(1).max(80),
  treatmentId: z.string().min(1).max(80),
});

const bookingSchema = z.object({
  slot: slotSchema,
  patientName: z.string().min(1).max(120).default("Visitante Portfolio"),
  patientEmail: z.email().default("visitante@example.com"),
  patientPhone: z.string().min(1).max(40).default("600 000 000"),
  notes: z.string().max(500).default("Cita creada desde recepcion online."),
});

const privateActionSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("confirm"),
    appointmentId: z.string().min(1),
  }),
  z.object({
    action: z.literal("cancel"),
    appointmentId: z.string().min(1),
  }),
  z.object({
    action: z.literal("move"),
    appointmentId: z.string().min(1),
    slot: slotSchema.omit({ treatmentId: true }).extend({
      treatmentId: z.string().min(1).optional(),
      notes: z.string().max(500).optional(),
    }),
  }),
  z.object({
    action: z.literal("reset"),
  }),
]);

function isAuthorized(request: Request) {
  return request.headers.get("x-doctor-pin") === env.DOCTOR_DASHBOARD_PIN;
}

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

function sortAppointments(appointments: Appointment[]) {
  return [...appointments].sort((a, b) =>
    `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`),
  );
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return unauthorized();
  }

  return NextResponse.json({
    appointments: sortAppointments(await listAppointments()),
  });
}

export async function POST(request: Request) {
  const rateLimit = checkRateLimit(getClientKey(request, "appointments"), {
    limit: 12,
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

  const body = bookingSchema.parse(await request.json());
  const appointment = await createAppointmentRequest({
    patientName: body.patientName,
    patientEmail: body.patientEmail,
    patientPhone: body.patientPhone,
    treatmentId: body.slot.treatmentId,
    therapistId: body.slot.therapistId,
    date: body.slot.date,
    time: body.slot.time,
    notes: body.notes,
  });

  return NextResponse.json({ appointment });
}

export async function PATCH(request: Request) {
  if (!isAuthorized(request)) {
    return unauthorized();
  }

  const body = privateActionSchema.parse(await request.json());

  if (body.action === "reset") {
    return NextResponse.json({
      appointments: sortAppointments(await resetAppointments()),
    });
  }

  if (body.action === "cancel") {
    return NextResponse.json({
      appointments: sortAppointments(
        await cancelAppointmentRequest(body.appointmentId),
      ),
    });
  }

  if (body.action === "confirm") {
    const result = await confirmAppointmentRequest(body.appointmentId);

    return NextResponse.json({
      appointment: result.appointment,
      appointments: sortAppointments(result.appointments),
    });
  }

  return NextResponse.json({
    appointments: sortAppointments(
      await moveAppointmentRequest(body.appointmentId, body.slot),
    ),
  });
}
