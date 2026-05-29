import { createSupabaseAdminClient } from "@/lib/supabase/admin";

import {
  bookDemoAppointment,
  cancelDemoAppointment,
  confirmDemoAppointment,
  getDemoAppointments,
  moveDemoAppointment,
  requestDemoAppointment,
  resetDemoAppointmentStore,
} from "./appointment-store";
import { seedAppointments } from "./demo-data";
import type { Appointment } from "./types";

type AppointmentInput = Omit<Appointment, "id" | "status">;

type AppointmentRow = {
  id: string;
  patient_name: string;
  patient_email: string;
  patient_phone: string;
  treatment_id: string;
  therapist_id: string;
  date: string;
  time: string;
  status: Appointment["status"];
  notes: string | null;
  wants_earlier?: boolean | null;
};

function getSupabase() {
  return createSupabaseAdminClient();
}

function toAppointment(row: AppointmentRow): Appointment {
  return {
    id: row.id,
    patientName: row.patient_name,
    patientEmail: row.patient_email,
    patientPhone: row.patient_phone,
    treatmentId: row.treatment_id,
    therapistId: row.therapist_id,
    date: row.date,
    time: row.time,
    status: row.status,
    notes: row.notes ?? undefined,
    wantsEarlier: row.wants_earlier ?? false,
  };
}

function toRow(appointment: Appointment): AppointmentRow {
  return {
    id: appointment.id,
    patient_name: appointment.patientName,
    patient_email: appointment.patientEmail,
    patient_phone: appointment.patientPhone,
    treatment_id: appointment.treatmentId,
    therapist_id: appointment.therapistId,
    date: appointment.date,
    time: appointment.time,
    status: appointment.status,
    notes: appointment.notes ?? null,
    wants_earlier: appointment.wantsEarlier ?? false,
  };
}

async function listSupabaseAppointments() {
  const supabase = getSupabase();

  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("appointments")
    .select("*")
    .order("date", { ascending: true })
    .order("time", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data as AppointmentRow[]).map(toAppointment);
}

export async function listAppointments() {
  return (await listSupabaseAppointments()) ?? getDemoAppointments();
}

export async function createAppointmentRequest(input: AppointmentInput) {
  const supabase = getSupabase();

  if (!supabase) {
    return requestDemoAppointment(input);
  }

  const appointment: Appointment = {
    id: `apt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    ...input,
    status: "pending",
  };
  const { data, error } = await supabase
    .from("appointments")
    .insert(toRow(appointment))
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return toAppointment(data as AppointmentRow);
}

export async function createConfirmedAppointmentRequest(
  input: AppointmentInput,
) {
  const supabase = getSupabase();

  if (!supabase) {
    return bookDemoAppointment(input);
  }

  const appointment: Appointment = {
    id: `apt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    ...input,
    status: "confirmed",
  };
  const { data, error } = await supabase
    .from("appointments")
    .insert(toRow(appointment))
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return toAppointment(data as AppointmentRow);
}

export async function confirmAppointmentRequest(appointmentId: string) {
  const supabase = getSupabase();

  if (!supabase) {
    return confirmDemoAppointment(appointmentId);
  }

  const { data, error } = await supabase
    .from("appointments")
    .update({ status: "confirmed" })
    .eq("id", appointmentId)
    .neq("status", "cancelled")
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return {
    appointment: toAppointment(data as AppointmentRow),
    appointments: await listAppointments(),
  };
}

export async function cancelAppointmentRequest(appointmentId: string) {
  const supabase = getSupabase();

  if (!supabase) {
    return cancelDemoAppointment(appointmentId);
  }

  const { error } = await supabase
    .from("appointments")
    .update({ status: "cancelled" })
    .eq("id", appointmentId);

  if (error) {
    throw new Error(error.message);
  }

  return listAppointments();
}

export async function moveAppointmentRequest(
  appointmentId: string,
  changes: Partial<
    Pick<
      Appointment,
      "date" | "time" | "therapistId" | "treatmentId" | "notes" | "wantsEarlier"
    >
  >,
) {
  const supabase = getSupabase();

  if (!supabase) {
    return moveDemoAppointment(appointmentId, changes);
  }

  const { error } = await supabase
    .from("appointments")
    .update({
      date: changes.date,
      time: changes.time,
      therapist_id: changes.therapistId,
      treatment_id: changes.treatmentId,
      notes: changes.notes,
      wants_earlier: changes.wantsEarlier,
      status: "confirmed",
    })
    .eq("id", appointmentId);

  if (error) {
    throw new Error(error.message);
  }

  return listAppointments();
}

export async function resetAppointments() {
  const supabase = getSupabase();

  if (!supabase) {
    return resetDemoAppointmentStore();
  }

  const { error: deleteError } = await supabase
    .from("appointments")
    .delete()
    .neq("id", "");

  if (deleteError) {
    throw new Error(deleteError.message);
  }

  const { error: insertError } = await supabase
    .from("appointments")
    .insert(seedAppointments.map(toRow));

  if (insertError) {
    throw new Error(insertError.message);
  }

  return listAppointments();
}
