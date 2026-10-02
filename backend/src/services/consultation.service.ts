import crypto from 'node:crypto';
import { getDatabase } from '../db/index.js';
import { AppError } from '../middleware/errorHandler.js';
import {
  AuthenticatedUserPayload,
  ConsultationBookingRequest,
  ConsultationCreatedData,
  ConsultationRecord,
  ConsultationStatusUpdateRequest,
} from '../types/index.js';

export class ConsultationService {
  private get db() {
    return getDatabase();
  }

  public createConsultation(
    clientId: string,
    data: ConsultationBookingRequest
  ): ConsultationCreatedData {
    const { advocate_id, slot_id, intake_id, mode, notes } = data;

    if (!advocate_id || !slot_id || !mode) {
      throw new AppError(
        400,
        'VALIDATION_FAILED',
        'advocate_id, slot_id, and consultation mode are required'
      );
    }

    if (!['audio', 'video', 'in_person'].includes(mode)) {
      throw new AppError(400, 'VALIDATION_FAILED', 'Invalid consultation mode');
    }

    // Verify advocate exists and is verified
    const advocate = this.db
      .prepare('SELECT id, verification_status FROM advocate_profiles WHERE id = ?')
      .get(advocate_id) as { id: string; verification_status: string } | undefined;

    if (!advocate) {
      throw new AppError(404, 'NOT_FOUND', `Advocate profile not found for id: ${advocate_id}`);
    }

    if (advocate.verification_status !== 'verified') {
      throw new AppError(
        400,
        'VALIDATION_FAILED',
        'Consultations can only be scheduled with verified advocates'
      );
    }

    // Verify slot exists and is available
    const slot = this.db
      .prepare('SELECT id, advocate_id, start_time, is_booked FROM consultation_slots WHERE id = ?')
      .get(slot_id) as
      | { id: string; advocate_id: string; start_time: string; is_booked: number }
      | undefined;

    if (!slot) {
      throw new AppError(404, 'NOT_FOUND', `Consultation slot not found for id: ${slot_id}`);
    }

    if (slot.advocate_id !== advocate_id) {
      throw new AppError(
        400,
        'VALIDATION_FAILED',
        'Selected slot does not belong to the specified advocate'
      );
    }

    if (Boolean(slot.is_booked)) {
      throw new AppError(
        409,
        'SLOT_ALREADY_BOOKED',
        'This consultation slot has already been booked by another client'
      );
    }

    // Mark slot as booked
    this.db.prepare('UPDATE consultation_slots SET is_booked = 1 WHERE id = ?').run(slot_id);

    const consultationId = `consultation-${crypto.randomUUID()}`;
    const workspaceId = `workspace-${crypto.randomUUID()}`;

    // Create consultation
    this.db
      .prepare(`
        INSERT INTO consultations (
          id, client_id, advocate_id, slot_id, scheduled_at, mode, notes, status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 'requested', datetime('now'))
      `)
      .run(consultationId, clientId, advocate_id, slot_id, slot.start_time, mode, notes || null);

    // Auto-provision Case Workspace
    this.db
      .prepare(`
        INSERT INTO case_workspaces (
          id, consultation_id, client_id, advocate_id, title, status, created_at
        ) VALUES (?, ?, ?, ?, ?, 'active', datetime('now'))
      `)
      .run(
        workspaceId,
        consultationId,
        clientId,
        advocate_id,
        `Legal Advisory Workspace - #${consultationId.slice(-6)}`
      );

    // Link intake if provided
    if (intake_id) {
      this.db
        .prepare(`UPDATE case_intakes SET status = 'linked_to_consultation' WHERE id = ?`)
        .run(intake_id);
    }

    const consultationRecord = this.db
      .prepare('SELECT * FROM consultations WHERE id = ?')
      .get(consultationId) as unknown as ConsultationRecord;

    return {
      consultation: consultationRecord,
      workspace_id: workspaceId,
    };
  }

  public listConsultations(user: AuthenticatedUserPayload): ConsultationRecord[] {
    if (user.role === 'admin') {
      return this.db
        .prepare('SELECT * FROM consultations ORDER BY scheduled_at DESC')
        .all() as unknown as ConsultationRecord[];
    }

    if (user.role === 'advocate') {
      const advProfile = this.db
        .prepare('SELECT id FROM advocate_profiles WHERE user_id = ?')
        .get(user.id) as { id: string } | undefined;

      if (!advProfile) {
        return [];
      }

      return this.db
        .prepare(
          'SELECT * FROM consultations WHERE advocate_id = ? ORDER BY scheduled_at DESC'
        )
        .all(advProfile.id) as unknown as ConsultationRecord[];
    }

    // Client role
    return this.db
      .prepare('SELECT * FROM consultations WHERE client_id = ? ORDER BY scheduled_at DESC')
      .all(user.id) as unknown as ConsultationRecord[];
  }

  public getConsultation(id: string, user: AuthenticatedUserPayload): ConsultationRecord {
    const consultation = this.db
      .prepare('SELECT * FROM consultations WHERE id = ?')
      .get(id) as ConsultationRecord | undefined;

    if (!consultation) {
      throw new AppError(404, 'NOT_FOUND', `Consultation not found for id: ${id}`);
    }

    // Role check
    if (user.role === 'admin') {
      return consultation;
    }

    if (user.role === 'client' && consultation.client_id !== user.id) {
      throw new AppError(403, 'FORBIDDEN', 'Access denied to this consultation booking');
    }

    if (user.role === 'advocate') {
      const advProfile = this.db
        .prepare('SELECT id FROM advocate_profiles WHERE user_id = ?')
        .get(user.id) as { id: string } | undefined;

      if (!advProfile || advProfile.id !== consultation.advocate_id) {
        throw new AppError(403, 'FORBIDDEN', 'Access denied to this consultation booking');
      }
    }

    return consultation;
  }

  public updateConsultationStatus(
    id: string,
    data: ConsultationStatusUpdateRequest,
    user: AuthenticatedUserPayload
  ): ConsultationRecord {
    const { status, notes } = data;

    const validStatuses = [
      'requested',
      'confirmed',
      'reschedule_offered',
      'declined',
      'completed',
      'cancelled',
    ];
    if (!validStatuses.includes(status)) {
      throw new AppError(400, 'VALIDATION_FAILED', `Invalid consultation status: ${status}`);
    }

    const consultation = this.getConsultation(id, user);

    if (status === 'cancelled' || status === 'declined') {
      // Release slot
      this.db
        .prepare('UPDATE consultation_slots SET is_booked = 0 WHERE id = ?')
        .run(consultation.slot_id);
    }

    this.db
      .prepare(`
        UPDATE consultations
        SET status = ?, notes = COALESCE(?, notes)
        WHERE id = ?
      `)
      .run(status, notes || null, id);

    return this.db
      .prepare('SELECT * FROM consultations WHERE id = ?')
      .get(id) as unknown as ConsultationRecord;
  }
}

export const consultationService = new ConsultationService();
