import { NextResponse } from "next/server";
import { z } from "zod";

import { env } from "@/lib/env";
import {
  bookDemoAppointment,
  cancelDemoAppointment,
  getDemoAppointments,
  moveDemoAppointment,
  resetDemoAppointmentStore,
} from "@/lib/receptionist/appointment-store";
import type { Appointment } from "@/lib/receptionist/types";

const slotSchema = z.object({
  date: z.string().min(1),
  time: z.string().min(1),
  therapistId: z.string().min(1),
  treatmentId: z.string().min(1),
});

const bookingSchema = z.object({
  slot: slotSchema,
  patientName: z.string().min(1).default("Visitante Portfolio"),
  patientEmail: z.email().default("visitante@example.com"),
  patientPhone: z.string().min(1).default("600 000 000"),
  notes: z.string().default("Cita creada desde recepción online."),
});

const privateActionSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("cancel"),
    appointmentId: z.string().min(1),
  }),
  z.object({
    action: z.literal("move"),
    appointmentId: z.string().min(1),
    slot: slotSchema.omit({ treatmentId: true }).extend({
      treatmentId: z.string().min(1).optional(),
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
    appointments: sortAppointments(getDemoAppointments()),
  });
}

export async function POST(request: Request) {
  const body = bookingSchema.parse(await request.json());
  const appointment = bookDemoAppointment({
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
      appointments: sortAppointments(resetDemoAppointmentStore()),
    });
  }

  if (body.action === "cancel") {
    return NextResponse.json({
      appointments: sortAppointments(cancelDemoAppointment(body.appointmentId)),
    });
  }

  return NextResponse.json({
    appointments: sortAppointments(
      moveDemoAppointment(body.appointmentId, body.slot),
    ),
  });
}
