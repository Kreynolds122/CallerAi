import { createClient } from "@supabase/supabase-js";
import { projectId, publicAnonKey } from "../../utils/supabase/info";

export const supabase = createClient(
  `https://${projectId}.supabase.co`,
  publicAnonKey
);

// Snake_case DB rows → camelCase app types
export function transformLead(row: Record<string, unknown>) {
  return {
    id: row.id as string,
    locationId: row.location_id as string,
    fullName: row.full_name as string,
    phone: (row.phone as string) ?? "",
    email: (row.email as string) ?? "",
    source: row.source as "Phone" | "Website Chat",
    status: row.status as "New" | "Contacted" | "Booked" | "Completed" | "Lost",
    reason: (row.reason as string) ?? "",
    preferredTime: (row.preferred_time as string) ?? "",
    appointmentDateTime: (row.appointment_datetime as string | undefined),
    assignedTo: (row.assigned_to as string | undefined),
    smsStatus: row.sms_status as string | undefined,
    newOrReturning: row.new_or_returning as string | undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    notes: (row.notes as string) ?? "",
  };
}

export function transformCall(row: Record<string, unknown>) {
  return {
    id: row.id as string,
    leadId: (row.lead_id as string) ?? "",
    locationId: (row.location_id as string) ?? "",
    dateTime: (row.date_time as string) ?? (row.created_at as string),
    duration: (row.duration_minutes as number) ?? 0,
    talkSeconds: row.talk_seconds as number | undefined,
    ailmentType: row.ailment_type as string | undefined,
    outcome: row.outcome as "Completed" | "Voicemail" | "No Answer" | "Failed",
    transcript: (row.transcript as string) ?? "",
    summary: (row.summary as string) ?? "",
  };
}

export function transformChat(row: Record<string, unknown>) {
  return {
    id: row.id as string,
    leadId: (row.lead_id as string) ?? "",
    locationId: (row.location_id as string) ?? "",
    dateTime: (row.date_time as string) ?? (row.created_at as string),
    transcript: (row.transcript as string) ?? "",
    summary: (row.summary as string) ?? "",
  };
}

export function transformLocation(row: Record<string, unknown>) {
  return {
    id: row.id as string,
    name: row.name as string,
    address: (row.address as string) ?? "",
    phone: (row.phone as string) ?? "",
    businessHours: (row.business_hours as string) ?? "",
    status: (row.status as "Active" | "Pilot") ?? "Active",
    calendarId: (row.calendar_id as string) ?? "",
    mondayBoardId: (row.monday_board_id as string) ?? "",
  };
}
