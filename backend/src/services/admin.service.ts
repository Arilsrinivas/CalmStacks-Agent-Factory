import { getDatabase } from '../db/index.js';
import { AppError } from '../middleware/errorHandler.js';
import {
  AdminAnalyticsData,
  AdminVerificationRequest,
  AdvocateProfilePublic,
} from '../types/index.js';

interface RawAdvocateRow {
  id: string;
  user_id: string;
  bar_council_enrollment: string;
  state_bar_council: string;
  experience_years: number;
  practice_areas: string;
  courts: string;
  languages: string;
  city: string;
  state: string;
  consultation_fee: number;
  bio: string | null;
  verification_status: 'pending' | 'verified' | 'rejected' | 'suspended';
  created_at: string;
  full_name: string;
}

export class AdminService {
  private get db() {
    return getDatabase();
  }

  private mapRawRow(row: RawAdvocateRow): AdvocateProfilePublic {
    return {
      id: row.id,
      user_id: row.user_id,
      bar_council_enrollment: row.bar_council_enrollment,
      state_bar_council: row.state_bar_council,
      experience_years: Number(row.experience_years),
      practice_areas: JSON.parse(row.practice_areas || '[]'),
      courts: JSON.parse(row.courts || '[]'),
      languages: JSON.parse(row.languages || '[]'),
      city: row.city,
      state: row.state,
      consultation_fee: Number(row.consultation_fee),
      bio: row.bio,
      verification_status: row.verification_status,
      created_at: row.created_at,
      full_name: row.full_name,
    };
  }

  public listPendingAdvocates(): AdvocateProfilePublic[] {
    const rows = this.db
      .prepare(`
        SELECT ap.*, u.full_name
        FROM advocate_profiles ap
        JOIN users u ON ap.user_id = u.id
        WHERE ap.verification_status = 'pending'
        ORDER BY ap.created_at ASC
      `)
      .all() as unknown as RawAdvocateRow[];

    return rows.map((r) => this.mapRawRow(r));
  }

  public verifyAdvocate(id: string, data: AdminVerificationRequest): AdvocateProfilePublic {
    const { verification_status } = data;

    if (!['verified', 'rejected'].includes(verification_status)) {
      throw new AppError(
        400,
        'VALIDATION_FAILED',
        "verification_status must be either 'verified' or 'rejected'"
      );
    }

    const existing = this.db
      .prepare('SELECT id FROM advocate_profiles WHERE id = ?')
      .get(id);

    if (!existing) {
      throw new AppError(404, 'NOT_FOUND', `Advocate profile not found for id: ${id}`);
    }

    this.db
      .prepare('UPDATE advocate_profiles SET verification_status = ? WHERE id = ?')
      .run(verification_status, id);

    const updated = this.db
      .prepare(`
        SELECT ap.*, u.full_name
        FROM advocate_profiles ap
        JOIN users u ON ap.user_id = u.id
        WHERE ap.id = ?
      `)
      .get(id) as unknown as RawAdvocateRow;

    return this.mapRawRow(updated);
  }

  public getAnalytics(): AdminAnalyticsData {
    const totalUsers = (
      this.db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number }
    ).count;

    const totalVerifiedAdvocates = (
      this.db
        .prepare("SELECT COUNT(*) as count FROM advocate_profiles WHERE verification_status = 'verified'")
        .get() as { count: number }
    ).count;

    const pendingVerifications = (
      this.db
        .prepare("SELECT COUNT(*) as count FROM advocate_profiles WHERE verification_status = 'pending'")
        .get() as { count: number }
    ).count;

    const totalIntakes = (
      this.db.prepare('SELECT COUNT(*) as count FROM case_intakes').get() as { count: number }
    ).count;

    const totalConsultations = (
      this.db.prepare('SELECT COUNT(*) as count FROM consultations').get() as { count: number }
    ).count;

    const activeWorkspaces = (
      this.db
        .prepare("SELECT COUNT(*) as count FROM case_workspaces WHERE status = 'active'")
        .get() as { count: number }
    ).count;

    // Calculate practice area breakdown
    const verifiedAdvocates = this.db
      .prepare("SELECT practice_areas FROM advocate_profiles WHERE verification_status = 'verified'")
      .all() as Array<{ practice_areas: string }>;

    const breakdown: Record<string, number> = {};
    for (const adv of verifiedAdvocates) {
      try {
        const areas: string[] = JSON.parse(adv.practice_areas || '[]');
        for (const area of areas) {
          breakdown[area] = (breakdown[area] || 0) + 1;
        }
      } catch {
        // ignore parse error
      }
    }

    return {
      total_registered_users: totalUsers,
      total_verified_advocates: totalVerifiedAdvocates,
      pending_verifications_count: pendingVerifications,
      total_intakes_submitted: totalIntakes,
      total_consultations_booked: totalConsultations,
      active_workspaces_count: activeWorkspaces,
      practice_area_breakdown: breakdown,
    };
  }
}

export const adminService = new AdminService();
