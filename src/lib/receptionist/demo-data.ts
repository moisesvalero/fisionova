import type { Appointment, Therapist, Treatment } from "./types";

export const clinicProfile = {
  name: "FisioNova Clinica",
  tagline: "Fisioterapia cercana para volver a moverte con confianza.",
  address: "Calle Salud 18, Madrid",
  phone: "910 123 456",
  email: "hola@fisionova.demo",
  openingHours: "lunes a viernes, 9:00-20:00",
};

export const treatments: Treatment[] = [
  {
    id: "general",
    name: "Fisioterapia general",
    durationMinutes: 50,
    price: 45,
    description:
      "Dolor muscular, contracturas, movilidad y recuperacion funcional.",
  },
  {
    id: "sports",
    name: "Fisioterapia deportiva",
    durationMinutes: 50,
    price: 50,
    description: "Prevencion y recuperacion de lesiones deportivas.",
  },
  {
    id: "postural",
    name: "Reeducacion postural",
    durationMinutes: 60,
    price: 55,
    description: "Trabajo guiado para espalda, cuello y habitos posturales.",
  },
];

export const therapists: Therapist[] = [
  { id: "marta", name: "Marta Ruiz", specialty: "Fisioterapia deportiva" },
  { id: "alvaro", name: "Alvaro Marin", specialty: "Dolor de espalda y postura" },
];

export const availableTimes = [
  "09:30",
  "10:30",
  "12:00",
  "16:30",
  "17:30",
  "18:30",
];

export const demoDates = [
  "2026-06-01",
  "2026-06-02",
  "2026-06-03",
  "2026-06-04",
  "2026-06-05",
];

export const seedAppointments: Appointment[] = [
  {
    id: "apt-demo-1",
    patientName: "Laura Gomez",
    patientEmail: "laura@example.com",
    patientPhone: "600 111 222",
    treatmentId: "sports",
    therapistId: "marta",
    date: "2026-06-02",
    time: "17:30",
    status: "confirmed",
    notes: "Molestia en rodilla derecha.",
  },
];

export const quickPrompts = [
  "Quiero cita el viernes por la tarde",
  "Cuanto cuesta la fisioterapia deportiva?",
  "Necesito cambiar mi cita",
  "Donde esta la clinica?",
];
