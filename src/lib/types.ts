export type LocationStatus = "Active" | "Pilot";
export type LeadStatus = "New" | "Contacted" | "Booked" | "Completed" | "Lost";
export type LeadSource = "Phone" | "Website Chat";
export type CallOutcome = "Completed" | "Voicemail" | "No Answer" | "Failed";

export interface Location {
  id: string;
  name: string;
  address: string;
  phone: string;
  businessHours: string;
  status: LocationStatus;
  calendarId: string;
  mondayBoardId: string;
}

export interface Lead {
  id: string;
  locationId: string;
  fullName: string;
  phone: string;
  email: string;
  source: LeadSource;
  status: LeadStatus;
  reason: string;
  preferredTime: string;
  appointmentDateTime?: string;
  assignedTo?: string;
  smsStatus?: string;
  createdAt: string;
  updatedAt: string;
  notes: string;
}

export interface Call {
  id: string;
  leadId: string;
  locationId: string;
  dateTime: string;
  duration: number;
  talkSeconds?: number;
  ailmentType?: string;
  outcome: CallOutcome;
  transcript: string;
  summary: string;
}

export interface Chat {
  id: string;
  leadId: string;
  locationId: string;
  dateTime: string;
  transcript: string;
  summary: string;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  email: string;
  locationIds: string[];
}
