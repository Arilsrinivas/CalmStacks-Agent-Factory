import { getDatabase } from '../db/index.js';
import { AppError } from '../middleware/errorHandler.js';
import {
  AdvocateDirectoryFilterQuery,
  AdvocateProfilePublic,
  ConsultationSlotRecord,
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

export class AdvocateService {
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

  public listAdvocates(filters: AdvocateDirectoryFilterQuery): AdvocateProfilePublic[] {
    const rows = this.db
      .prepare(`
        SELECT ap.*, u.full_name
        FROM advocate_profiles ap
        JOIN users u ON ap.user_id = u.id
        WHERE ap.verification_status = 'verified'
        ORDER BY u.full_name ASC
      `)
      .all() as unknown as RawAdvocateRow[];

    let advocates = rows.map((r) => this.mapRawRow(r));

    // Filter by city
    if (filters.city) {
      const cityQuery = filters.city.trim().toLowerCase();
      advocates = advocates.filter((a) => a.city.toLowerCase().includes(cityQuery));
    }

    // Filter by practice area
    if (filters.practice_area) {
      const paQuery = filters.practice_area.trim().toLowerCase();
      advocates = advocates.filter((a) =>
        a.practice_areas.some((pa) => pa.toLowerCase().includes(paQuery))
      );
    }

    // Filter by language
    if (filters.language) {
      const langQuery = filters.language.trim().toLowerCase();
      advocates = advocates.filter((a) =>
        a.languages.some((l) => l.toLowerCase().includes(langQuery))
      );
    }

    // Filter by minimum experience
    if (filters.min_exp !== undefined && !isNaN(Number(filters.min_exp))) {
      const minExp = Number(filters.min_exp);
      advocates = advocates.filter((a) => a.experience_years >= minExp);
    }

    // Filter by maximum fee
    if (filters.fee !== undefined && !isNaN(Number(filters.fee))) {
      const maxFee = Number(filters.fee);
      advocates = advocates.filter((a) => a.consultation_fee <= maxFee);
    }

    return advocates;
  }

  public getAdvocateProfile(id: string): AdvocateProfilePublic {
    const row = this.db
      .prepare(`
        SELECT ap.*, u.full_name
        FROM advocate_profiles ap
        JOIN users u ON ap.user_id = u.id
        WHERE ap.id = ?
      `)
      .get(id) as unknown as RawAdvocateRow | undefined;

    if (!row) {
      throw new AppError(404, 'NOT_FOUND', `Advocate profile not found for id: ${id}`);
    }

    return this.mapRawRow(row);
  }

  public getAdvocateSlots(id: string): ConsultationSlotRecord[] {
    // Verify advocate exists
    const advocate = this.db
      .prepare('SELECT id FROM advocate_profiles WHERE id = ?')
      .get(id);

    if (!advocate) {
      throw new AppError(404, 'NOT_FOUND', `Advocate not found for id: ${id}`);
    }

    const rows = this.db
      .prepare(`
        SELECT id, advocate_id, start_time, end_time, mode, is_booked, created_at
        FROM consultation_slots
        WHERE advocate_id = ? AND is_booked = 0
        ORDER BY start_time ASC
      `)
      .all(id) as unknown as Array<{
        id: string;
        advocate_id: string;
        start_time: string;
        end_time: string;
        mode: 'audio' | 'video' | 'in_person';
        is_booked: number;
        created_at: string;
      }>;

    return rows.map((r) => ({
      ...r,
      is_booked: Boolean(r.is_booked),
    }));
  }
}

export const advocateService = new AdvocateService();
