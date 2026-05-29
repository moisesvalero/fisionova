export type Treatment = {
  id: string;
  name: string;
  durationMinutes: number;
  price: number;
  description: string;
};

export type Therapist = {
  id: string;
  name: string;
  specialty: string;
};

export type AppointmentStatus = "pending" | "confirmed" | "cancelled";

export type Appointment = {
  id: string;
  patientName: string;
  patientEmail: string;
  patientPhone: string;
  treatmentId: string;
  therapistId: string;
  date: string;
  time: string;
  status: AppointmentStatus;
  notes?: string;
};

export type AppointmentSlot = {
  id: string;
  date: string;
  time: string;
  therapistId: string;
  treatmentId: string;
};

export type PatientDetails = {
  patientName: string;
  patientEmail: string;
  patientPhone: string;
};

export type PatientVerification = Pick<
  PatientDetails,
  "patientEmail" | "patientPhone"
>;

export type ChatMessage = {
  id: string;
  role: "assistant" | "user";
  content: string;
};

export type ReceptionAction =
  | { type: "reply"; message: string; requestedDate?: string | null }
  | {
      type: "propose_slots";
      message: string;
      slots: AppointmentSlot[];
      requestedDate?: string | null;
    }
  | {
      type: "request_manage_booking";
      operation: "cancel" | "modify";
      message: string;
      requestedDate?: string | null;
    }
  | { type: "confirm_booking"; message: string; appointment: Appointment }
  | { type: "cancel_booking"; message: string; appointmentId: string }
  | { type: "modify_booking"; message: string; appointment: Appointment };

export type EmailEventType = "confirmation" | "modification" | "cancellation";

export type EmailLogItem = {
  id: string;
  type: EmailEventType;
  recipient: string;
  subject: string;
  body: string;
  status: "sent" | "simulated" | "failed";
  createdAt: string;
};
