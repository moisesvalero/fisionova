import { clinicProfile, therapists, treatments } from "./demo-data";
import type { Appointment, EmailEventType } from "./types";

export function buildAppointmentEmail(
  type: EmailEventType,
  appointment: Appointment,
) {
  const treatment = treatments.find((item) => item.id === appointment.treatmentId);
  const therapist = therapists.find((item) => item.id === appointment.therapistId);
  const typeText = {
    confirmation: "confirmada",
    modification: "modificada",
    cancellation: "cancelada",
  }[type];

  return {
    subject: `Tu cita ha sido ${typeText} - ${clinicProfile.name}`,
    body: [
      `Hola ${appointment.patientName},`,
      "",
      `Tu cita ha sido ${typeText}.`,
      `Tratamiento: ${treatment?.name ?? "Fisioterapia"}`,
      `Profesional: ${therapist?.name ?? "Equipo de fisioterapia"}`,
      `Fecha y hora: ${appointment.date} a las ${appointment.time}`,
      "",
      `Clinica: ${clinicProfile.address}`,
      `Telefono: ${clinicProfile.phone}`,
    ].join("\n"),
  };
}
