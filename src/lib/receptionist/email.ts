import { clinicProfile, therapists, treatments } from "./demo-data";
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
        : "cancelada";
  const patientName = escapeHtml(appointment.patientName);
  const treatmentName = escapeHtml(treatment?.name ?? "Fisioterapia");
  const therapistName = escapeHtml(therapist?.name ?? "Equipo de fisioterapia");
  const appointmentDateTime = escapeHtml(
    `${appointment.date} a las ${appointment.time}`,
  );
  const phoneHref = escapeHtml(`tel:${clinicProfile.phone.replace(/\s/g, "")}`);
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
      `Tu cita ha sido ${typeText}.`,
      `Tratamiento: ${treatment?.name ?? "Fisioterapia"}`,
      `Profesional: ${therapist?.name ?? "Equipo de fisioterapia"}`,
      `Fecha y hora: ${appointment.date} a las ${appointment.time}`,
      ...changeFallback,
      "",
      `Clinica: ${clinicProfile.address}`,
      `Telefono: ${clinicProfile.phone}`,
      "",
      "Proyecto demo desarrollado por Moises Valero.",
      "Si te gusta este trabajo y quieres algo parecido para tu empresa, puedes contratarme aqui:",
      "moisesvalero.es",
    ].join("\n"),
    html: `<!doctype html>
<html lang="es">
  <body style="margin:0;background:#f4f0e8;font-family:Arial,Helvetica,sans-serif;color:#24302e;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f0e8;padding:28px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#fffaf2;border:1px solid #e1dacd;border-radius:16px;overflow:hidden;">
            <tr>
              <td style="background:#22312d;padding:24px 28px;color:#fffaf2;">
                <div style="font-size:13px;letter-spacing:.08em;text-transform:uppercase;color:#b8d6c0;">FisioNova Clinica</div>
                <h1 style="margin:10px 0 0;font-family:Georgia,serif;font-size:28px;line-height:1.15;font-weight:500;">Cita ${typeText}</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:28px;">
                <p style="margin:0 0 16px;font-size:16px;line-height:1.6;">Hola ${patientName},</p>
                <p style="margin:0 0 24px;font-size:16px;line-height:1.6;">Tu cita ha sido <strong>${typeText}</strong>. Te dejamos los datos principales:</p>
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
                ${changeFallbackHtml}
                <div style="background:#eef5ed;border:1px solid #d7e6d5;border-radius:12px;padding:18px;">
                  <p style="margin:0 0 12px;font-size:14px;line-height:1.55;color:#31413b;">Esta demo ha sido desarrollada por <strong>Moises Valero</strong>. Si te gusta este trabajo y quieres algo parecido para tu empresa, puedes ver mi portfolio aqui:</p>
                  <a href="${portfolioUrl}" style="display:inline-block;background:#22312d;color:#fffaf2;text-decoration:none;border-radius:8px;padding:11px 16px;font-size:14px;font-weight:700;">Ver portfolio</a>
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:18px 28px;background:#f7f2ea;color:#7b857f;font-size:12px;line-height:1.5;">
                ${escapeHtml(clinicProfile.phone)} · Proyecto demo de portfolio tecnico
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
