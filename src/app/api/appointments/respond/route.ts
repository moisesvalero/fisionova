import { NextResponse } from "next/server";

import {
  cancelAppointmentRequest,
  listAppointments,
  updateAppointmentStatusRequest,
} from "@/lib/receptionist/appointment-repository";
import { verifyAppointmentActionToken } from "@/lib/receptionist/action-token";

function htmlResponse(title: string, message: string, status = 200) {
  return new NextResponse(
    `<!doctype html><html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title><body style="margin:0;font-family:Arial,sans-serif;background:#f4f0e8;color:#22312d;display:grid;min-height:100vh;place-items:center;padding:24px;"><main style="max-width:560px;background:#fffaf2;border:1px solid #e1dacd;border-radius:18px;padding:28px;"><p style="margin:0 0 8px;color:#6f8878;text-transform:uppercase;letter-spacing:.12em;font-size:12px;">FisioNova Clinica</p><h1 style="margin:0 0 12px;font-family:Georgia,serif;font-size:32px;font-weight:500;">${title}</h1><p style="margin:0;line-height:1.6;">${message}</p></main></body></html>`,
    {
      status,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    },
  );
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");

  if (!token) {
    return htmlResponse(
      "Enlace no valido",
      "No hemos podido reconocer esta accion de cita.",
      400,
    );
  }

  const payload = verifyAppointmentActionToken(token);

  if (!payload) {
    return htmlResponse(
      "Enlace caducado",
      "Este enlace ya no es valido. Llama a recepcion si necesitas tocar la cita.",
      400,
    );
  }

  const appointments = await listAppointments();
  const appointment = appointments.find(
    (item) => item.id === payload.appointmentId,
  );

  if (!appointment || appointment.status === "cancelled") {
    return htmlResponse(
      "Cita no encontrada",
      "No hemos encontrado una cita activa asociada a este enlace.",
      404,
    );
  }

  if (payload.action === "cancel") {
    await cancelAppointmentRequest(payload.appointmentId);

    return htmlResponse(
      "Cita cancelada",
      "Hemos cancelado la cita. Si necesitas otra hora, puedes volver a escribir a recepcion.",
    );
  }

  await updateAppointmentStatusRequest(
    payload.appointmentId,
    "patient_confirmed",
  );

  return htmlResponse(
    "Cita confirmada",
    "Gracias, tu cita queda confirmada. Te esperamos en FisioNova.",
  );
}
