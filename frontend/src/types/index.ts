/**
 * LegalConnect Frontend Type Definitions
 * Re-exports core types from contracts/types.ts and defines client UI states.
 */

export type UserRole = 'client' | 'advocate' | 'admin';
export type VerificationStatus = 'pending' | 'verified' | 'rejected' | 'suspended';
export type IntakeStatus = 'draft' | 'submitted' | 'linked_to_consultation' | 'closed';
export type ConsultationMode = 'audio' | 'video' | 'in_person';
export type ConsultationStatus =
  | 'requested'
  | 'confirmed'
  | 'reschedule_offered'
  | 'declined'
  | 'completed'
  | 'cancelled';
export type WorkspaceStatus = 'active' | 'advisory_issued' | 'closed';

export interface UserRecord {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  phone: string;
  created_at: string;
}

export interface AdvocateProfileRecord {
  id: string;
  user_id: string;
  full_name?: string;
  bar_council_enrollment: string;
  state_bar_council: string;
  experience_years: number;
  practice_areas: string[];
  courts: string[];
  languages: string[];
  city: string;
  state: string;
  consultation_fee: number;
  bio: string | null;
  verification_status: VerificationStatus;
  created_at: string;
}

export interface CaseIntakeRecord {
  id: string;
  client_id: string;
  raw_problem_description: string;
  preferred_language: string;
  status: IntakeStatus;
  created_at: string;
}

export interface PartiesInvolved {
  client_role: string;
  opposing_party: string;
  dispute_nature?: string;
  [key: string]: unknown;
}

export interface AIIntakeSummaryRecord {
  id: string;
  intake_id: string;
  facts_summary: string;
  parties_involved: PartiesInvolved;
  key_relief_sought: string;
  suggested_practice_areas: string[];
  disclaimer_accepted: boolean;
  statutory_disclaimer?: string;
  missing_information?: string[];
  created_at: string;
}

export interface ConsultationSlotRecord {
  id: string;
  advocate_id: string;
  start_time: string;
  end_time: string;
  mode: ConsultationMode;
  is_booked: boolean;
  created_at: string;
}

export interface ConsultationRecord {
  id: string;
  client_id: string;
  client_name?: string;
  advocate_id: string;
  advocate_name?: string;
  slot_id: string;
  scheduled_at: string;
  mode: ConsultationMode;
  notes: string | null;
  status: ConsultationStatus;
  reschedule_proposals?: string[];
  created_at: string;
}

export interface CaseWorkspaceRecord {
  id: string;
  consultation_id: string;
  client_id: string;
  advocate_id: string;
  title: string;
  status: WorkspaceStatus;
  created_at: string;
  intake_summary?: AIIntakeSummaryRecord;
}

export interface CaseDocumentRecord {
  id: string;
  workspace_id: string;
  uploaded_by_user_id: string;
  uploaded_by_name?: string;
  file_name: string;
  file_url: string;
  file_size_bytes: number;
  mime_type: string;
  category?: 'Agreement/Contract' | 'Legal Notice' | 'Police Complaint/FIR' | 'Court Order/Pleadings' | 'Identity Proof' | 'Financial Statement';
  created_at: string;
}

export interface WorkspaceMessageRecord {
  id: string;
  workspace_id: string;
  sender_id: string;
  sender_name?: string;
  sender_role?: UserRole;
  message_text: string;
  attachments?: Record<string, unknown>[];
  created_at: string;
}

export interface AdminAnalyticsData {
  total_registered_users: number;
  total_verified_advocates: number;
  pending_verifications_count: number;
  total_intakes_submitted: number;
  total_consultations_booked: number;
  active_workspaces_count: number;
  practice_area_breakdown: Record<string, number>;
}
