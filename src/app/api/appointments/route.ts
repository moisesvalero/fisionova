import { NextResponse } from "next/server";
import { z } from "zod";

import { env } from "@/lib/env";
import { checkRateLimit, getClientKey } from "@/lib/rate-limit";
import { findAvailableSlots } from "@/lib/receptionist/agenda";
import {
  cancelAppointmentRequest,
  confirmAppointmentRequest,
  createBlockedSlotRequest,
  createConfirmedAppointmentRequest,
  createAppointmentRequest,
  listAppointments,
  moveAppointmentRequest,
  resetAppointments,
  updateAppointmentStatusRequest,
} from "@/lib/receptionist/appointment-repository";
import { buildAppointmentEmail } from "@/lib/receptionist/email";
import type { Appointment, EmailEventType } from "@/lib/receptionist/types";

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
  wantsEarlier: z.boolean().default(false),
});

const manualAppointmentSchema = z.object({
  patientName: z.string().min(1).max(120),
  patientEmail: z.email(),
  patientPhone: z.string().min(1).max(40),
  treatmentId: z.string().min(1).max(80),
  therapistId: z.string().min(1).max(80),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^\d{2}:\d{2}$/),
  notes: z.string().max(500).default("Cita creada manualmente desde el panel."),
  wantsEarlier: z.boolean().default(false),
});

const appointmentStatusSchema = z.enum([
  "pending",
  "awaiting_response",
  "confirmed",
  "patient_confirmed",
  "reschedule_proposed",
  "cancelled",
  "no_show",
  "blocked",
]);

const blockSlotSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^\d{2}:\d{2}$/),
  therapistId: z.string().min(1).max(80),
  notes: z.string().min(1).max(120).default("Bloqueo manual"),
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
      wantsEarlier: z.boolean().optional(),
    }),
  }),
  z.object({
    action: z.literal("create_manual"),
    appointment: manualAppointmentSchema,
  }),
  z.object({
    action: z.literal("create_block"),
    slot: blockSlotSchema,
  }),
  z.object({
    action: z.literal("set_status"),
    appointmentId: z.string().min(1),
    status: appointmentStatusSchema.exclude(["blocked"]),
  }),
  z.object({
    action: z.literal("reset"),
  }),
]);

const patientContactSchema = z.object({
  patientEmail: z.email().max(254),
  patientPhone: z.string().min(1).max(40),
});

const patientActionSchema = z.discriminatedUnion("action", [
  z
    .object({
      action: z.literal("patient_lookup"),
      operation: z.enum(["cancel", "modify"]),
      requestedDate: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/)
        .nullable()
        .optional(),
    })
    .extend(patientContactSchema.shape),
  z
    .object({
      action: z.literal("patient_cancel"),
    })
    .extend(patientContactSchema.shape),
  z
    .object({
      action: z.literal("patient_move"),
      appointmentId: z.string().min(1),
      slot: slotSchema,
    })
    .extend(patientContactSchema.shape),
]);

const patchActionSchema = z.discriminatedUnion("action", [
  ...privateActionSchema.options,
  ...patientActionSchema.options,
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

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function normalizePhone(phone: string) {
  return phone.replace(/\D/g, "");
}

function findVerifiedAppointment(
  appointments: Appointment[],
  contact: z.infer<typeof patientContactSchema>,
  appointmentId?: string,
) {
  const patientEmail = normalizeEmail(contact.patientEmail);
  const patientPhone = normalizePhone(contact.patientPhone);

  return sortAppointments(appointments).find(
    (appointment) =>
      appointment.status !== "cancelled" &&
      (!appointmentId || appointment.id === appointmentId) &&
      normalizeEmail(appointment.patientEmail) === patientEmail &&
      normalizePhone(appointment.patientPhone) === patientPhone,
  );
}

async function sendAppointmentEmail(
  type: EmailEventType,
  appointment: Appointment,
) {
  const email = buildAppointmentEmail(type, appointment);
  const recipient = env.RESEND_TEST_RECIPIENT ?? appointment.patientEmail;
  const emailBody = env.RESEND_TEST_RECIPIENT
    ? `${email.body}\n\n[Demo] Destinatario original: ${appointment.patientEmail}`
    : email.body;
  const emailHtml = env.RESEND_TEST_RECIPIENT
    ? email.html.replace(
        "</body>",
        `<p style="font-family:Verdana,sans-serif;color:#69756f;font-size:12px;text-align:center;">Destinatario original: ${appointment.patientEmail}</p></body>`,
      )
    : email.html;

  if (!env.RESEND_API_KEY || !env.RESEND_FROM_EMAIL) {
    return { status: "simulated" as const, email, recipient };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
      "Idempotency-Key": `patient-${type}-${appointment.id}-${appointment.date}-${appointment.time}-${appointment.status}`,
      "User-Agent": "FisioNova-Appointment-Emails/1.0",
    },
    body: JSON.stringify({
      from: `FisioNova <${env.RESEND_FROM_EMAIL}>`,
      to: recipient,
      reply_to: env.RESEND_REPLY_TO_EMAIL ?? env.RESEND_FROM_EMAIL,
      subject: email.subject,
      text: emailBody,
      html: emailHtml,
      headers: {
        "X-Entity-Ref-ID": `patient-${type}-${appointment.id}-${appointment.date}-${appointment.time}`,
        "X-Auto-Response-Suppress": "All",
      },
      tags: [
        { name: "category", value: "appointment" },
        { name: "event", value: type },
      ],
    }),
  });

  if (!response.ok) {
    return { status: "failed" as const, email, recipient };
  }

  return { status: "sent" as const, email, recipient };
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
    wantsEarlier: body.wantsEarlier,
  });

  return NextResponse.json({ appointment });
}

export async function PATCH(request: Request) {
  const body = patchActionSchema.parse(await request.json());

  if (
    body.action === "patient_lookup" ||
    body.action === "patient_cancel" ||
    body.action === "patient_move"
  ) {
    const rateLimit = checkRateLimit(getClientKey(request, "patient-manage"), {
      limit: 8,
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

    const appointments = await listAppointments();
    const appointmentId =
      body.action === "patient_move" ? body.appointmentId : undefined;
    const appointment = findVerifiedAppointment(
      appointments,
      body,
      appointmentId,
    );

    if (!appointment) {
      return NextResponse.json(
        { error: "No active appointment found for those details." },
        { status: 404 },
      );
    }

    if (body.action === "patient_lookup") {
      return NextResponse.json({
        appointment,
        slots:
          body.operation === "modify"
            ? findAvailableSlots(appointments, {
                treatmentId: appointment.treatmentId,
                date: body.requestedDate ?? undefined,
              })
            : [],
      });
    }

    if (body.action === "patient_cancel") {
      const nextAppointments = await cancelAppointmentRequest(appointment.id);
      const cancelled = nextAppointments.find(
        (item) => item.id === appointment.id,
      ) ?? {
        ...appointment,
        status: "cancelled" as const,
      };
      const email = await sendAppointmentEmail("cancellation", cancelled);

      return NextResponse.json({
        appointment: cancelled,
        appointments: sortAppointments(nextAppointments),
        email,
      });
    }

    const nextAppointments = await moveAppointmentRequest(appointment.id, {
      ...body.slot,
      notes:
        `Cambio solicitado por el paciente desde recepción online. ${appointment.notes ?? ""}`.trim(),
    });
    const moved =
      nextAppointments.find((item) => item.id === appointment.id) ??
      appointment;
    const email = await sendAppointmentEmail("modification", moved);

    return NextResponse.json({
      appointment: moved,
      appointments: sortAppointments(nextAppointments),
      email,
    });
  }

  if (!isAuthorized(request)) {
    return unauthorized();
  }

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

  if (body.action === "create_manual") {
    const appointment = await createConfirmedAppointmentRequest(
      body.appointment,
    );

    return NextResponse.json({
      appointment,
      appointments: sortAppointments(await listAppointments()),
    });
  }

  if (body.action === "create_block") {
    const appointment = await createBlockedSlotRequest(body.slot);

    return NextResponse.json({
      appointment,
      appointments: sortAppointments(await listAppointments()),
    });
  }

  if (body.action === "set_status") {
    return NextResponse.json({
      appointments: sortAppointments(
        await updateAppointmentStatusRequest(body.appointmentId, body.status),
      ),
    });
  }

  if (body.action === "move") {
    return NextResponse.json({
      appointments: sortAppointments(
        await moveAppointmentRequest(body.appointmentId, body.slot),
      ),
    });
  }

  return NextResponse.json({ error: "Unsupported action" }, { status: 400 });
}
