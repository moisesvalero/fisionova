import { clinicProfile, therapists, treatments } from "./demo-data";
import { createAppointmentActionToken } from "./action-token";
import type { Appointment, EmailEventType } from "./types";

const portfolioUrl = "https://moisesvalero.es/";

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function buildAppointmentEmail(
  type: EmailEventType,
  appointment: Appointment,
) {
  const treatment = treatments.find(
    (item) => item.id === appointment.treatmentId,
  );
  const therapist = therapists.find(
    (item) => item.id === appointment.therapistId,
  );
  const typeText =
    type === "confirmation"
      ? "confirmada"
      : type === "modification"
        ? "modificada"
        : type === "cancellation"
          ? "cancelada"
          : type === "reminder"
            ? "recordatorio"
            : type === "reschedule_proposal"
              ? "propuesta de cambio"
              : "hueco disponible";
  const titleText =
    type === "reminder"
      ? "Recordatorio de cita"
      : type === "reschedule_proposal"
        ? "Propuesta para cambiar tu cita"
        : type === "waitlist_offer"
          ? "Tenemos un hueco antes"
          : `Cita ${typeText}`;
  const patientName = escapeHtml(appointment.patientName);
  const treatmentName = escapeHtml(treatment?.name ?? "Fisioterapia");
  const therapistName = escapeHtml(therapist?.name ?? "Equipo de fisioterapia");
  const appointmentDateTime = escapeHtml(
    `${appointment.date} a las ${appointment.time}`,
  );
  const phoneHref = escapeHtml(`tel:${clinicProfile.phone.replace(/\s/g, "")}`);
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ??
    "http://localhost:3000";
  const confirmUrl = escapeHtml(
    `${appUrl}/api/appointments/respond?token=${createAppointmentActionToken(
      appointment.id,
      "confirm",
    )}`,
  );
  const cancelUrl = escapeHtml(
    `${appUrl}/api/appointments/respond?token=${createAppointmentActionToken(
      appointment.id,
      "cancel",
    )}`,
  );
  const changeFallback =
    type === "modification"
      ? [
          "",
          `Si este cambio no te encaja, llamanos y lo ajustamos contigo: ${clinicProfile.phone}.`,
        ]
      : [];
  const changeFallbackHtml =
    type === "modification"
      ? `<p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#31413b;">Si este cambio no te encaja, llamanos y lo ajustamos contigo: <a href="${phoneHref}" style="color:#22312d;font-weight:700;text-decoration:underline;">${escapeHtml(clinicProfile.phone)}</a>.</p>`
      : "";

  return {
    subject: `Tu cita ha sido ${typeText} - ${clinicProfile.name}`,
    body: [
      `Hola ${appointment.patientName},`,
      "",
      type === "reminder"
        ? "Te recordamos tu cita."
        : type === "waitlist_offer"
          ? "Se ha liberado un hueco antes. Si te encaja, contacta con recepcion."
          : `Tu cita ha sido ${typeText}.`,
      `Tratamiento: ${treatment?.name ?? "Fisioterapia"}`,
      `Profesional: ${therapist?.name ?? "Equipo de fisioterapia"}`,
      `Fecha y hora: ${appointment.date} a las ${appointment.time}`,
      ...changeFallback,
      "",
      `Clinica: ${clinicProfile.address}`,
      `Telefono: ${clinicProfile.phone}`,
      "",
      `Confirmar cita: ${confirmUrl}`,
      `Cancelar cita: ${cancelUrl}`,
      "",
      "Este email pertenece a una demo tecnica de Moises Valero.",
      `Portfolio: ${portfolioUrl}`,
    ].join("\n"),
    html: `<!doctype html>
<html lang="es">
  <body style="margin:0;background:#f4f0e8;font-family:Verdana,sans-serif;color:#24302e;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f0e8;padding:28px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#fffaf2;border:1px solid #e1dacd;border-radius:16px;overflow:hidden;">
            <tr>
              <td style="background:#22312d;padding:24px 28px;color:#fffaf2;">
                <div style="font-size:13px;letter-spacing:.08em;text-transform:uppercase;color:#b8d6c0;">FisioNova Clinica</div>
                <h1 style="margin:10px 0 0;font-family:Georgia,serif;font-size:28px;line-height:1.15;font-weight:500;">${titleText}</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:28px;">
                <p style="margin:0 0 16px;font-size:16px;line-height:1.6;">Hola ${patientName},</p>
                <p style="margin:0 0 24px;font-size:16px;line-height:1.6;">${type === "reminder" ? "Te recordamos tu cita. Estos son los datos principales:" : type === "waitlist_offer" ? "Se ha liberado un hueco antes. Estos son los datos de tu cita actual:" : `Tu cita ha sido <strong>${typeText}</strong>. Te dejamos los datos principales:`}</p>
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;margin:0 0 24px;">
                  <tr>
                    <td style="padding:12px 0;border-bottom:1px solid #ebe4d8;color:#69756f;font-size:13px;">Tratamiento</td>
                    <td align="right" style="padding:12px 0;border-bottom:1px solid #ebe4d8;font-size:14px;font-weight:700;">${treatmentName}</td>
                  </tr>
                  <tr>
                    <td style="padding:12px 0;border-bottom:1px solid #ebe4d8;color:#69756f;font-size:13px;">Profesional</td>
                    <td align="right" style="padding:12px 0;border-bottom:1px solid #ebe4d8;font-size:14px;font-weight:700;">${therapistName}</td>
                  </tr>
                  <tr>
                    <td style="padding:12px 0;border-bottom:1px solid #ebe4d8;color:#69756f;font-size:13px;">Fecha y hora</td>
                    <td align="right" style="padding:12px 0;border-bottom:1px solid #ebe4d8;font-size:14px;font-weight:700;">${appointmentDateTime}</td>
                  </tr>
                  <tr>
                    <td style="padding:12px 0;color:#69756f;font-size:13px;">Clinica</td>
                    <td align="right" style="padding:12px 0;font-size:14px;font-weight:700;">${escapeHtml(clinicProfile.address)}</td>
                  </tr>
                </table>
                <table role="presentation" cellspacing="0" cellpadding="0" style="margin:0 0 24px;">
                  <tr>
                    <td style="padding-right:10px;">
                      <a href="${confirmUrl}" style="display:inline-block;background:#22312d;color:#fffaf2;text-decoration:none;border-radius:10px;padding:12px 16px;font-weight:700;font-size:14px;">Confirmar</a>
                    </td>
                    <td>
                      <a href="${cancelUrl}" style="display:inline-block;background:#f4f0e8;color:#22312d;text-decoration:none;border:1px solid #e1dacd;border-radius:10px;padding:11px 16px;font-weight:700;font-size:14px;">Cancelar</a>
                    </td>
                  </tr>
                </table>
                ${changeFallbackHtml}
                <p style="margin:0;font-size:12px;line-height:1.5;color:#7b857f;">Demo tecnica desarrollada por Moises Valero. Portfolio: <a href="${portfolioUrl}" style="color:#4f625b;text-decoration:underline;">moisesvalero.es</a></p>
              </td>
            </tr>
            <tr>
              <td style="padding:18px 28px;background:#f7f2ea;color:#7b857f;font-size:12px;line-height:1.5;">
                ${escapeHtml(clinicProfile.phone)} · Email transaccional de cita
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`,
  };
}
