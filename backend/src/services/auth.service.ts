import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { getDatabase } from '../db/index.js';
import { AppError } from '../middleware/errorHandler.js';
import { signToken } from '../middleware/auth.js';
import {
  UserRegistrationRequest,
  UserLoginRequest,
  AuthSuccessData,
  UserRecord,
} from '../types/index.js';

export class AuthService {
  private get db() {
    return getDatabase();
  }

  public register(data: UserRegistrationRequest): AuthSuccessData {
    const { email, password, full_name, role, phone } = data;

    if (!email || !password || !full_name || !role || !phone) {
      throw new AppError(400, 'VALIDATION_FAILED', 'All registration fields are required');
    }

    if (
      typeof email !== 'string' ||
      typeof password !== 'string' ||
      typeof full_name !== 'string' ||
      typeof role !== 'string' ||
      typeof phone !== 'string'
    ) {
      throw new AppError(400, 'VALIDATION_FAILED', 'Invalid input format for registration fields');
    }

    if (!['client', 'advocate', 'admin'].includes(role)) {
      throw new AppError(400, 'VALIDATION_FAILED', 'Invalid user role specified');
    }

    if (password.length < 8) {
      throw new AppError(400, 'VALIDATION_FAILED', 'Password must be at least 8 characters in length');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new AppError(400, 'VALIDATION_FAILED', 'Invalid email address format');
    }

    // Check existing email or phone
    const existing = this.db
      .prepare('SELECT id FROM users WHERE email = ? OR phone = ?')
      .get(email.toLowerCase(), phone);

    if (existing) {
      throw new AppError(409, 'USER_ALREADY_EXISTS', 'A user with this email or phone number already exists');
    }

    const userId = `user-${crypto.randomUUID()}`;
    const passwordHash = bcrypt.hashSync(password, 8);

    this.db
      .prepare(`
        INSERT INTO users (id, email, password_hash, full_name, role, phone, created_at)
        VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
      `)
      .run(userId, email.toLowerCase(), passwordHash, full_name, role, phone);

    // If registering as advocate, create initial pending profile
    if (role === 'advocate') {
      const profileId = `adv-${crypto.randomUUID()}`;
      const enrollmentNo = `TEMP/${Math.floor(1000 + Math.random() * 9000)}/${new Date().getFullYear()}`;
      this.db
        .prepare(`
          INSERT INTO advocate_profiles (
            id, user_id, bar_council_enrollment, state_bar_council, experience_years,
            practice_areas, courts, languages, city, state, consultation_fee, bio, verification_status, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
        `)
        .run(
          profileId,
          userId,
          enrollmentNo,
          'State Bar Council Pending',
          0,
          JSON.stringify(['General Practice']),
          JSON.stringify(['District Court']),
          JSON.stringify(['English', 'Hindi']),
          'New Delhi',
          'Delhi',
          1000.0,
          'Newly registered advocate awaiting credential verification',
          'pending'
        );
    }

    const userRecord = this.db
      .prepare('SELECT id, email, full_name, role, phone, created_at FROM users WHERE id = ?')
      .get(userId) as Omit<UserRecord, 'password_hash'>;

    const token = signToken({
      id: userRecord.id,
      email: userRecord.email,
      role: userRecord.role,
      full_name: userRecord.full_name,
    });

    return {
      token,
      user: userRecord,
    };
  }

  public login(data: UserLoginRequest): AuthSuccessData {
    const { email, password } = data;

    if (!email || !password) {
      throw new AppError(400, 'VALIDATION_FAILED', 'Email and password are required');
    }

    if (typeof email !== 'string' || typeof password !== 'string') {
      throw new AppError(400, 'VALIDATION_FAILED', 'Invalid input format for email or password');
    }

    const user = this.db
      .prepare('SELECT * FROM users WHERE email = ?')
      .get(email.toLowerCase()) as UserRecord | undefined;

    if (!user) {
      throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
    }

    const isValid = bcrypt.compareSync(password, user.password_hash);
    if (!isValid) {
      throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
    }

    const { password_hash, ...userProfile } = user;
    const token = signToken({
      id: user.id,
      email: user.email,
      role: user.role,
      full_name: user.full_name,
    });

    return {
      token,
      user: userProfile,
    };
  }

  public getProfile(userId: string): Omit<UserRecord, 'password_hash'> {
    const user = this.db
      .prepare('SELECT id, email, full_name, role, phone, created_at FROM users WHERE id = ?')
      .get(userId) as Omit<UserRecord, 'password_hash'> | undefined;

    if (!user) {
      throw new AppError(404, 'NOT_FOUND', 'User profile not found');
    }

    return user;
  }
}

export const authService = new AuthService();
