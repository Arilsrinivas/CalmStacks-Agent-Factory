/**
 * LegalConnect API Client & Mock Store
 * Implements endpoints specified in contracts/api.yaml.
 * Operates against real backend or local reactive storage for standalone testing.
 */

import {
  UserRecord,
  UserRole,
  AdvocateProfileRecord,
  ConsultationSlotRecord,
  ConsultationRecord,
  CaseWorkspaceRecord,
  CaseDocumentRecord,
  WorkspaceMessageRecord,
  AIIntakeSummaryRecord,
  AdminAnalyticsData,
  ConsultationMode,
  ConsultationStatus,
} from '../types';
import {
  INITIAL_USERS,
  INITIAL_ADVOCATES,
  INITIAL_SLOTS,
  INITIAL_CONSULTATIONS,
  INITIAL_WORKSPACES,
  INITIAL_DOCUMENTS,
  INITIAL_MESSAGES,
  INITIAL_ADMIN_ANALYTICS,
} from './mockData';

// Storage Keys
const STORAGE_PREFIX = 'legalconnect_mvp_';
const USERS_KEY = `${STORAGE_PREFIX}users`;
const ADVOCATES_KEY = `${STORAGE_PREFIX}advocates`;
const SLOTS_KEY = `${STORAGE_PREFIX}slots`;
const CONSULTATIONS_KEY = `${STORAGE_PREFIX}consultations`;
const WORKSPACES_KEY = `${STORAGE_PREFIX}workspaces`;
const DOCUMENTS_KEY = `${STORAGE_PREFIX}documents`;
const MESSAGES_KEY = `${STORAGE_PREFIX}messages`;
const ANALYTICS_KEY = `${STORAGE_PREFIX}analytics`;
const AUTH_KEY = `${STORAGE_PREFIX}auth_user`;

// Storage Helper
function getStored<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function setStored<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.error('Storage error', err);
  }
}

export class LegalConnectApiClient {
  private static instance: LegalConnectApiClient;

  private constructor() {
    this.initDefaults();
  }

  public static getInstance(): LegalConnectApiClient {
    if (!LegalConnectApiClient.instance) {
      LegalConnectApiClient.instance = new LegalConnectApiClient();
    }
    return LegalConnectApiClient.instance;
  }

  private initDefaults() {
    if (!localStorage.getItem(USERS_KEY)) setStored(USERS_KEY, INITIAL_USERS);
    if (!localStorage.getItem(ADVOCATES_KEY)) setStored(ADVOCATES_KEY, INITIAL_ADVOCATES);
    if (!localStorage.getItem(SLOTS_KEY)) setStored(SLOTS_KEY, INITIAL_SLOTS);
    if (!localStorage.getItem(CONSULTATIONS_KEY)) setStored(CONSULTATIONS_KEY, INITIAL_CONSULTATIONS);
    if (!localStorage.getItem(WORKSPACES_KEY)) setStored(WORKSPACES_KEY, INITIAL_WORKSPACES);
    if (!localStorage.getItem(DOCUMENTS_KEY)) setStored(DOCUMENTS_KEY, INITIAL_DOCUMENTS);
    if (!localStorage.getItem(MESSAGES_KEY)) setStored(MESSAGES_KEY, INITIAL_MESSAGES);
    if (!localStorage.getItem(ANALYTICS_KEY)) setStored(ANALYTICS_KEY, INITIAL_ADMIN_ANALYTICS);
  }

  public resetAllToDefaults(): void {
    localStorage.removeItem(USERS_KEY);
    localStorage.removeItem(ADVOCATES_KEY);
    localStorage.removeItem(SLOTS_KEY);
    localStorage.removeItem(CONSULTATIONS_KEY);
    localStorage.removeItem(WORKSPACES_KEY);
    localStorage.removeItem(DOCUMENTS_KEY);
    localStorage.removeItem(MESSAGES_KEY);
    localStorage.removeItem(ANALYTICS_KEY);
    this.initDefaults();
  }

  // ---------------------------------------------------------------------------
  // Auth & Identity
  // ---------------------------------------------------------------------------
  public getCurrentUser(): UserRecord | null {
    return getStored<UserRecord | null>(AUTH_KEY, INITIAL_USERS[0]);
  }

  public setCurrentUser(user: UserRecord | null): void {
    setStored(AUTH_KEY, user);
  }

  public switchRole(role: UserRole): UserRecord {
    const users = getStored<UserRecord[]>(USERS_KEY, INITIAL_USERS);
    const target = users.find((u) => u.role === role) || users[0];
    this.setCurrentUser(target);
    return target;
  }

  public async register(payload: {
    email: string;
    full_name: string;
    role: UserRole;
    phone: string;
    bar_enrollment?: string;
  }): Promise<{ user: UserRecord; token: string }> {
    const users = getStored<UserRecord[]>(USERS_KEY, INITIAL_USERS);
    const newUser: UserRecord = {
      id: `user-${Date.now()}`,
      email: payload.email,
      full_name: payload.full_name,
      role: payload.role,
      phone: payload.phone,
      created_at: new Date().toISOString(),
    };
    users.push(newUser);
    setStored(USERS_KEY, users);

    if (payload.role === 'advocate' && payload.bar_enrollment) {
      const advocates = getStored<AdvocateProfileRecord[]>(ADVOCATES_KEY, INITIAL_ADVOCATES);
      const newAdv: AdvocateProfileRecord = {
        id: `adv-${Date.now()}`,
        user_id: newUser.id,
        full_name: newUser.full_name,
        bar_council_enrollment: payload.bar_enrollment,
        state_bar_council: 'Bar Council of Delhi',
        experience_years: 1,
        practice_areas: ['General Practice', 'Civil Litigation'],
        courts: ['District Court'],
        languages: ['English', 'Hindi'],
        city: 'Delhi',
        state: 'Delhi (NCT)',
        consultation_fee: 1000,
        bio: 'Newly enrolled advocate profile pending administrative Bar Council verification.',
        verification_status: 'pending',
        created_at: new Date().toISOString(),
      };
      advocates.push(newAdv);
      setStored(ADVOCATES_KEY, advocates);
    }

    this.setCurrentUser(newUser);
    return { user: newUser, token: `jwt-token-${newUser.id}` };
  }

  // ---------------------------------------------------------------------------
  // Case Intake & AI Structuring
  // ---------------------------------------------------------------------------
  public async submitCaseIntake(rawProblem: string, preferredLanguage = 'English'): Promise<AIIntakeSummaryRecord> {
    // Deterministic factual parsing mimicking AI Case Assistant guardrails
    const lower = rawProblem.toLowerCase();

    // Determine practice areas based on terminology
    const areas: string[] = [];
    if (lower.includes('tenant') || lower.includes('rent') || lower.includes('landlord') || lower.includes('deposit') || lower.includes('property') || lower.includes('eviction')) {
      areas.push('Property & Real Estate');
    }
    if (lower.includes('cheque') || lower.includes('bounce') || lower.includes('138') || lower.includes('dishonor') || lower.includes('bank')) {
      areas.push('Cheque Bounce (Sec 138)');
    }
    if (lower.includes('divorce') || lower.includes('maintenance') || lower.includes('custody') || lower.includes('marriage') || lower.includes('spouse')) {
      areas.push('Family & Matrimonial');
    }
    if (lower.includes('consumer') || lower.includes('refund') || lower.includes('defect') || lower.includes('warranty') || lower.includes('service')) {
      areas.push('Consumer Protection');
    }
    if (lower.includes('company') || lower.includes('contract') || lower.includes('agreement') || lower.includes('vendor') || lower.includes('invoice')) {
      areas.push('Corporate & Commercial');
    }
    if (lower.includes('salary') || lower.includes('employee') || lower.includes('boss') || lower.includes('fired') || lower.includes('termination')) {
      areas.push('Labour & Employment');
    }
    if (areas.length === 0) {
      areas.push('Civil Litigation', 'Consumer Protection');
    }

    const missing: string[] = [];
    if (!lower.includes('202') && !lower.includes('day') && !lower.includes('month') && !lower.includes('yesterday') && !lower.includes('august') && !lower.includes('september')) {
      missing.push('Specific date or timeframe of the incident/cause of action');
    }
    if (!lower.includes('agreement') && !lower.includes('notice') && !lower.includes('receipt') && !lower.includes('bill') && !lower.includes('document')) {
      missing.push('Presence of supporting documentation (contracts, invoices, formal notices)');
    }

    const intakeSummary: AIIntakeSummaryRecord = {
      id: `ai-sum-${Date.now()}`,
      intake_id: `intake-${Date.now()}`,
      facts_summary: rawProblem.length > 50 ? rawProblem.trim() : `Complainant reports legal dispute involving: ${rawProblem.trim()}`,
      parties_involved: {
        client_role: 'Complainant / Aggrieved Party',
        opposing_party: lower.includes('landlord') ? 'Landlord / Property Owner' : lower.includes('company') ? 'Corporate Entity / Employer' : 'Opposing Counterparty',
        dispute_nature: areas[0] || 'Civil Grievance',
      },
      key_relief_sought: lower.includes('refund') || lower.includes('deposit') || lower.includes('money')
        ? 'Restitution, recovery of monetary dues and reimbursement of statutory damages'
        : 'Formal legal advisory, drafting of legal notice, or representation before appropriate court',
      suggested_practice_areas: areas,
      missing_information: missing,
      disclaimer_accepted: false,
      statutory_disclaimer:
        'LEGAL NOTICE & STATUTORY DISCLAIMER: This summary is automatically synthesized by an automated artificial intelligence system solely to assist in organizing factual statements for a legal practitioner. The AI Case Assistant does NOT provide legal advice, legal counsel, or legal representation. No advocate-client relationship is created by using this feature. Only a verified, enrolled advocate licensed by a State Bar Council can provide formal legal advice upon consultation.',
      created_at: new Date().toISOString(),
    };

    return intakeSummary;
  }

  // ---------------------------------------------------------------------------
  // Advocates Directory (BCI Rule 36 Compliant)
  // ---------------------------------------------------------------------------
  public async listAdvocates(filters?: {
    practice_area?: string;
    city?: string;
    court?: string;
    language?: string;
    fee?: number;
    search?: string;
  }): Promise<AdvocateProfileRecord[]> {
    const advocates = getStored<AdvocateProfileRecord[]>(ADVOCATES_KEY, INITIAL_ADVOCATES);
    // BCI Rule 36: Only verified advocates appear in public directory, no paid ranking
    let filtered = advocates.filter((a) => a.verification_status === 'verified');

    if (filters) {
      if (filters.practice_area && filters.practice_area !== 'All') {
        filtered = filtered.filter((a) =>
          a.practice_areas.some((p) => p.toLowerCase().includes(filters.practice_area!.toLowerCase()))
        );
      }
      if (filters.city && filters.city !== 'All') {
        filtered = filtered.filter((a) => a.city.toLowerCase() === filters.city!.toLowerCase());
      }
      if (filters.court && filters.court !== 'All') {
        filtered = filtered.filter((a) =>
          a.courts.some((c) => c.toLowerCase().includes(filters.court!.toLowerCase()))
        );
      }
      if (filters.language && filters.language !== 'All') {
        filtered = filtered.filter((a) =>
          a.languages.some((l) => l.toLowerCase() === filters.language!.toLowerCase())
        );
      }
      if (filters.fee) {
        filtered = filtered.filter((a) => a.consultation_fee <= filters.fee!);
      }
      if (filters.search) {
        const q = filters.search.toLowerCase();
        filtered = filtered.filter(
          (a) =>
            a.full_name?.toLowerCase().includes(q) ||
            a.practice_areas.some((p) => p.toLowerCase().includes(q)) ||
            a.city.toLowerCase().includes(q) ||
            a.courts.some((c) => c.toLowerCase().includes(q))
        );
      }
    }

    return filtered;
  }

  public async getAdvocateProfile(id: string): Promise<AdvocateProfileRecord | null> {
    const advocates = getStored<AdvocateProfileRecord[]>(ADVOCATES_KEY, INITIAL_ADVOCATES);
    return advocates.find((a) => a.id === id) || null;
  }

  public async getAdvocateSlots(advocateId: string): Promise<ConsultationSlotRecord[]> {
    const slots = getStored<ConsultationSlotRecord[]>(SLOTS_KEY, INITIAL_SLOTS);
    return slots.filter((s) => s.advocate_id === advocateId && !s.is_booked);
  }

  // ---------------------------------------------------------------------------
  // Consultations & Booking
  // ---------------------------------------------------------------------------
  public async listConsultations(userId?: string): Promise<ConsultationRecord[]> {
    const consultations = getStored<ConsultationRecord[]>(CONSULTATIONS_KEY, INITIAL_CONSULTATIONS);
    if (!userId) return consultations;
    return consultations.filter((c) => c.client_id === userId || c.advocate_id === userId);
  }

  public async bookConsultation(params: {
    client_id: string;
    client_name: string;
    advocate_id: string;
    advocate_name: string;
    slot_id: string;
    scheduled_at: string;
    mode: ConsultationMode;
    notes: string;
    intake_summary?: AIIntakeSummaryRecord;
  }): Promise<{ consultation: ConsultationRecord; workspace: CaseWorkspaceRecord }> {
    const consultations = getStored<ConsultationRecord[]>(CONSULTATIONS_KEY, INITIAL_CONSULTATIONS);
    const slots = getStored<ConsultationSlotRecord[]>(SLOTS_KEY, INITIAL_SLOTS);
    const workspaces = getStored<CaseWorkspaceRecord[]>(WORKSPACES_KEY, INITIAL_WORKSPACES);

    // Mark slot as booked
    const slotIdx = slots.findIndex((s) => s.id === params.slot_id);
    if (slotIdx >= 0) {
      slots[slotIdx].is_booked = true;
      setStored(SLOTS_KEY, slots);
    }

    const newConsId = `cons-${Date.now()}`;
    const newWsId = `ws-case-${Math.floor(1000 + Math.random() * 9000)}`;

    const newConsultation: ConsultationRecord = {
      id: newConsId,
      client_id: params.client_id,
      client_name: params.client_name,
      advocate_id: params.advocate_id,
      advocate_name: params.advocate_name,
      slot_id: params.slot_id,
      scheduled_at: params.scheduled_at,
      mode: params.mode,
      notes: params.notes,
      status: 'requested',
      created_at: new Date().toISOString(),
    };
    consultations.unshift(newConsultation);
    setStored(CONSULTATIONS_KEY, consultations);

    // Auto-provision Case Workspace
    const newWorkspace: CaseWorkspaceRecord = {
      id: newWsId,
      consultation_id: newConsId,
      client_id: params.client_id,
      advocate_id: params.advocate_id,
      title: `Case #${newWsId.replace('ws-', '').toUpperCase()}: Legal Consultation with ${params.advocate_name}`,
      status: 'active',
      created_at: new Date().toISOString(),
      intake_summary: params.intake_summary,
    };
    workspaces.unshift(newWorkspace);
    setStored(WORKSPACES_KEY, workspaces);

    // Initial system greeting message
    const messages = getStored<WorkspaceMessageRecord[]>(MESSAGES_KEY, INITIAL_MESSAGES);
    messages.push({
      id: `msg-${Date.now()}`,
      workspace_id: newWsId,
      sender_id: 'system',
      sender_name: 'LegalConnect Case Assistant',
      sender_role: 'admin',
      message_text: `Privileged case workspace created for ${params.client_name} and ${params.advocate_name}. Consultation scheduled for ${new Date(params.scheduled_at).toLocaleString('en-IN')}. Upload relevant documents to the vault.`,
      created_at: new Date().toISOString(),
    });
    setStored(MESSAGES_KEY, messages);

    // Update platform analytics
    const analytics = getStored<AdminAnalyticsData>(ANALYTICS_KEY, INITIAL_ADMIN_ANALYTICS);
    analytics.total_consultations_booked += 1;
    analytics.active_workspaces_count += 1;
    setStored(ANALYTICS_KEY, analytics);

    return { consultation: newConsultation, workspace: newWorkspace };
  }

  public async updateConsultationStatus(
    consultationId: string,
    status: ConsultationStatus,
    notes?: string
  ): Promise<ConsultationRecord | null> {
    const consultations = getStored<ConsultationRecord[]>(CONSULTATIONS_KEY, INITIAL_CONSULTATIONS);
    const idx = consultations.findIndex((c) => c.id === consultationId);
    if (idx === -1) return null;

    consultations[idx].status = status;
    if (notes) consultations[idx].notes = notes;
    setStored(CONSULTATIONS_KEY, consultations);
    return consultations[idx];
  }

  // ---------------------------------------------------------------------------
  // Case Workspaces
  // ---------------------------------------------------------------------------
  public async listWorkspaces(userId?: string): Promise<CaseWorkspaceRecord[]> {
    const workspaces = getStored<CaseWorkspaceRecord[]>(WORKSPACES_KEY, INITIAL_WORKSPACES);
    if (!userId) return workspaces;
    return workspaces.filter((w) => w.client_id === userId || w.advocate_id === userId || userId === 'user-admin-1');
  }

  public async getWorkspace(id: string): Promise<CaseWorkspaceRecord | null> {
    const workspaces = getStored<CaseWorkspaceRecord[]>(WORKSPACES_KEY, INITIAL_WORKSPACES);
    return workspaces.find((w) => w.id === id) || null;
  }

  public async listDocuments(workspaceId: string): Promise<CaseDocumentRecord[]> {
    const documents = getStored<CaseDocumentRecord[]>(DOCUMENTS_KEY, INITIAL_DOCUMENTS);
    return documents.filter((d) => d.workspace_id === workspaceId);
  }

  public async uploadDocument(doc: {
    workspace_id: string;
    uploaded_by_user_id: string;
    uploaded_by_name: string;
    file_name: string;
    file_size_bytes: number;
    mime_type: string;
    category?: 'Agreement/Contract' | 'Legal Notice' | 'Police Complaint/FIR' | 'Court Order/Pleadings' | 'Identity Proof' | 'Financial Statement';
  }): Promise<CaseDocumentRecord> {
    const documents = getStored<CaseDocumentRecord[]>(DOCUMENTS_KEY, INITIAL_DOCUMENTS);
    const newDoc: CaseDocumentRecord = {
      id: `doc-${Date.now()}`,
      workspace_id: doc.workspace_id,
      uploaded_by_user_id: doc.uploaded_by_user_id,
      uploaded_by_name: doc.uploaded_by_name,
      file_name: doc.file_name,
      file_url: `https://vault.legalconnect.local/cases/${doc.workspace_id}/${doc.file_name}`,
      file_size_bytes: doc.file_size_bytes,
      mime_type: doc.mime_type,
      category: doc.category || 'Agreement/Contract',
      created_at: new Date().toISOString(),
    };
    documents.unshift(newDoc);
    setStored(DOCUMENTS_KEY, documents);
    return newDoc;
  }

  public async listMessages(workspaceId: string): Promise<WorkspaceMessageRecord[]> {
    const messages = getStored<WorkspaceMessageRecord[]>(MESSAGES_KEY, INITIAL_MESSAGES);
    return messages.filter((m) => m.workspace_id === workspaceId);
  }

  public async sendMessage(params: {
    workspace_id: string;
    sender_id: string;
    sender_name: string;
    sender_role: UserRole;
    message_text: string;
  }): Promise<WorkspaceMessageRecord> {
    const messages = getStored<WorkspaceMessageRecord[]>(MESSAGES_KEY, INITIAL_MESSAGES);
    const newMsg: WorkspaceMessageRecord = {
      id: `msg-${Date.now()}`,
      workspace_id: params.workspace_id,
      sender_id: params.sender_id,
      sender_name: params.sender_name,
      sender_role: params.sender_role,
      message_text: params.message_text,
      created_at: new Date().toISOString(),
    };
    messages.push(newMsg);
    setStored(MESSAGES_KEY, messages);
    return newMsg;
  }

  // ---------------------------------------------------------------------------
  // Admin Verification & Platform Analytics
  // ---------------------------------------------------------------------------
  public async getPendingAdvocates(): Promise<AdvocateProfileRecord[]> {
    const advocates = getStored<AdvocateProfileRecord[]>(ADVOCATES_KEY, INITIAL_ADVOCATES);
    return advocates.filter((a) => a.verification_status === 'pending');
  }

  public async verifyAdvocate(advocateId: string, status: 'verified' | 'rejected'): Promise<AdvocateProfileRecord | null> {
    const advocates = getStored<AdvocateProfileRecord[]>(ADVOCATES_KEY, INITIAL_ADVOCATES);
    const idx = advocates.findIndex((a) => a.id === advocateId);
    if (idx === -1) return null;

    advocates[idx].verification_status = status;
    setStored(ADVOCATES_KEY, advocates);

    const analytics = getStored<AdminAnalyticsData>(ANALYTICS_KEY, INITIAL_ADMIN_ANALYTICS);
    if (status === 'verified') {
      analytics.total_verified_advocates += 1;
      analytics.pending_verifications_count = Math.max(0, analytics.pending_verifications_count - 1);
    } else {
      analytics.pending_verifications_count = Math.max(0, analytics.pending_verifications_count - 1);
    }
    setStored(ANALYTICS_KEY, analytics);

    return advocates[idx];
  }

  public async getAnalytics(): Promise<AdminAnalyticsData> {
    return getStored<AdminAnalyticsData>(ANALYTICS_KEY, INITIAL_ADMIN_ANALYTICS);
  }
}

export const api = LegalConnectApiClient.getInstance();
