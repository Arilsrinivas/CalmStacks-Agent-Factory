import bcrypt from 'bcryptjs';
import type { DatabaseSync } from 'node:sqlite';

export function seedDatabase(db: DatabaseSync): void {
  // Check if users already seeded
  const checkStmt = db.prepare('SELECT COUNT(*) as count FROM users');
  const result = checkStmt.get() as { count: number };
  if (result && result.count > 0) {
    return;
  }

  const saltRounds = 8;
  const adminHash = bcrypt.hashSync(process.env.SEED_ADMIN_PASSWORD || 'Admin@12345', saltRounds);
  const clientHash = bcrypt.hashSync(process.env.SEED_CLIENT_PASSWORD || 'Client@12345', saltRounds);
  const advocateHash = bcrypt.hashSync(process.env.SEED_ADVOCATE_PASSWORD || 'Advocate@12345', saltRounds);

  const insertUser = db.prepare(`
    INSERT INTO users (id, email, password_hash, full_name, role, phone, created_at)
    VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
  `);

  const insertAdvocate = db.prepare(`
    INSERT INTO advocate_profiles (
      id, user_id, bar_council_enrollment, state_bar_council, experience_years,
      practice_areas, courts, languages, city, state, consultation_fee, bio, verification_status, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
  `);

  const insertSlot = db.prepare(`
    INSERT INTO consultation_slots (id, advocate_id, start_time, end_time, mode, is_booked, created_at)
    VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
  `);

  // 1. Admin User
  insertUser.run(
    'user-admin-1',
    'admin@legalconnect.calmstacks.com',
    adminHash,
    'System Administrator',
    'admin',
    '+919800000001'
  );

  // 2. Client Users
  insertUser.run(
    'user-client-1',
    'client@example.com',
    clientHash,
    'Aarav Mehta',
    'client',
    '+919800000002'
  );

  insertUser.run(
    'user-client-2',
    'ananya.sharma@example.com',
    clientHash,
    'Ananya Sharma',
    'client',
    '+919800000003'
  );

  // 3. Realistic Indian Advocates across Delhi, Mumbai, Bengaluru, Chennai, Hyderabad, Kolkata
  const advocatesData = [
    {
      userId: 'user-adv-delhi',
      email: 'adv.rajesh.sharma@delhibar.org',
      fullName: 'Adv. Rajesh Kumar Sharma',
      phone: '+919811110001',
      profileId: 'adv-delhi-1',
      barEnrollment: 'D/1842/2012',
      stateBar: 'Bar Council of Delhi',
      exp: 12,
      practiceAreas: ['Property & Real Estate', 'Civil Litigation', 'Consumer Disputes'],
      courts: ['Delhi High Court', 'Tis Hazari District Court', 'Supreme Court of India'],
      languages: ['English', 'Hindi', 'Punjabi'],
      city: 'Delhi',
      state: 'Delhi',
      fee: 2500.0,
      bio: 'Practicing advocate at Delhi High Court specializing in commercial real estate contracts, land title disputes, and civil suits.',
      status: 'verified',
      slots: [
        { id: 'slot-delhi-1', start: '2026-10-10T10:00:00Z', end: '2026-10-10T10:45:00Z', mode: 'video' },
        { id: 'slot-delhi-2', start: '2026-10-10T14:00:00Z', end: '2026-10-10T14:45:00Z', mode: 'audio' },
        { id: 'slot-delhi-3', start: '2026-10-11T11:00:00Z', end: '2026-10-11T11:45:00Z', mode: 'in_person' },
      ],
    },
    {
      userId: 'user-adv-mumbai',
      email: 'adv.priya.deshmukh@bombaybar.org',
      fullName: 'Adv. Priya K. Deshmukh',
      phone: '+919822220002',
      profileId: 'adv-mumbai-1',
      barEnrollment: 'MAH/3419/2014',
      stateBar: 'Bar Council of Maharashtra & Goa',
      exp: 10,
      practiceAreas: ['Corporate & Commercial', 'Banking & Finance', 'Arbitration'],
      courts: ['Bombay High Court', 'City Civil Court Mumbai', 'NCLT Mumbai'],
      languages: ['English', 'Hindi', 'Marathi'],
      city: 'Mumbai',
      state: 'Maharashtra',
      fee: 3500.0,
      bio: 'Corporate and dispute resolution counsel appearing regularly before Bombay High Court and NCLT Mumbai Bench.',
      status: 'verified',
      slots: [
        { id: 'slot-mumbai-1', start: '2026-10-10T15:00:00Z', end: '2026-10-10T15:45:00Z', mode: 'video' },
        { id: 'slot-mumbai-2', start: '2026-10-11T10:00:00Z', end: '2026-10-11T10:45:00Z', mode: 'video' },
        { id: 'slot-mumbai-3', start: '2026-10-12T16:00:00Z', end: '2026-10-12T16:45:00Z', mode: 'audio' },
      ],
    },
    {
      userId: 'user-adv-bengaluru',
      email: 'adv.anand.venkatesh@karnatakabar.org',
      fullName: 'Adv. Anand R. Venkatesh',
      phone: '+919833330003',
      profileId: 'adv-bengaluru-1',
      barEnrollment: 'KAR/2150/2016',
      stateBar: 'Karnataka State Bar Council',
      exp: 8,
      practiceAreas: ['Labour & Employment', 'Technology & IP', 'Corporate & Commercial'],
      courts: ['Karnataka High Court', 'City Civil Court Bengaluru', 'DRT Bengaluru'],
      languages: ['English', 'Kannada', 'Hindi'],
      city: 'Bengaluru',
      state: 'Karnataka',
      fee: 2000.0,
      bio: 'Experienced tech startup and employment disputes advocate practicing in Bengaluru courts.',
      status: 'verified',
      slots: [
        { id: 'slot-bengaluru-1', start: '2026-10-10T09:30:00Z', end: '2026-10-10T10:15:00Z', mode: 'video' },
        { id: 'slot-bengaluru-2', start: '2026-10-11T14:30:00Z', end: '2026-10-11T15:15:00Z', mode: 'video' },
        { id: 'slot-bengaluru-3', start: '2026-10-12T11:00:00Z', end: '2026-10-12T11:45:00Z', mode: 'in_person' },
      ],
    },
    {
      userId: 'user-adv-chennai',
      email: 'adv.meenakshi.s@tamilnadubar.org',
      fullName: 'Adv. Meenakshi Sundaram',
      phone: '+919844440004',
      profileId: 'adv-chennai-1',
      barEnrollment: 'MS/1423/2011',
      stateBar: 'Bar Council of Tamil Nadu & Puducherry',
      exp: 13,
      practiceAreas: ['Family & Matrimonial', 'Civil Litigation', 'Property & Real Estate'],
      courts: ['Madras High Court', 'Madras City Civil Court', 'Family Court Chennai'],
      languages: ['English', 'Tamil'],
      city: 'Chennai',
      state: 'Tamil Nadu',
      fee: 1800.0,
      bio: 'Senior advocate at Madras High Court handling domestic relations, partition suits, and probate administration.',
      status: 'verified',
      slots: [
        { id: 'slot-chennai-1', start: '2026-10-10T11:00:00Z', end: '2026-10-10T11:45:00Z', mode: 'video' },
        { id: 'slot-chennai-2', start: '2026-10-11T16:00:00Z', end: '2026-10-11T16:45:00Z', mode: 'audio' },
      ],
    },
    {
      userId: 'user-adv-hyderabad',
      email: 'adv.venkat.rao@telanganabar.org',
      fullName: 'Adv. Venkat Raman Rao',
      phone: '+919855550005',
      profileId: 'adv-hyderabad-1',
      barEnrollment: 'AP/2984/2013',
      stateBar: 'Bar Council of Telangana & AP',
      exp: 11,
      practiceAreas: ['Criminal Defense', 'White Collar Crime', 'Civil Litigation'],
      courts: ['Telangana High Court', 'City Civil Court Hyderabad', 'NCLT Hyderabad'],
      languages: ['English', 'Telugu', 'Hindi'],
      city: 'Hyderabad',
      state: 'Telangana',
      fee: 2200.0,
      bio: 'Criminal defense practitioner with extensive experience in commercial disputes and bail matters before Telangana High Court.',
      status: 'verified',
      slots: [
        { id: 'slot-hyderabad-1', start: '2026-10-10T12:00:00Z', end: '2026-10-10T12:45:00Z', mode: 'video' },
        { id: 'slot-hyderabad-2', start: '2026-10-12T15:00:00Z', end: '2026-10-12T15:45:00Z', mode: 'video' },
      ],
    },
    {
      userId: 'user-adv-kolkata',
      email: 'adv.debashis.b@wbbar.org',
      fullName: 'Adv. Debashis Banerjee',
      phone: '+919866660006',
      profileId: 'adv-kolkata-1',
      barEnrollment: 'WB/1105/2010',
      stateBar: 'Bar Council of West Bengal',
      exp: 14,
      practiceAreas: ['Taxation', 'Constitutional Law', 'Consumer Disputes'],
      courts: ['Calcutta High Court', 'Alipore District Court', 'NCLT Kolkata'],
      languages: ['English', 'Bengali', 'Hindi'],
      city: 'Kolkata',
      state: 'West Bengal',
      fee: 2800.0,
      bio: 'Appears routinely before Calcutta High Court on constitutional writs, state direct taxation, and consumer appellate forums.',
      status: 'verified',
      slots: [
        { id: 'slot-kolkata-1', start: '2026-10-10T14:00:00Z', end: '2026-10-10T14:45:00Z', mode: 'video' },
        { id: 'slot-kolkata-2', start: '2026-10-11T10:30:00Z', end: '2026-10-11T11:15:00Z', mode: 'audio' },
      ],
    },
    {
      userId: 'user-adv-pending',
      email: 'adv.nitin.kulkarni@example.com',
      fullName: 'Adv. Nitin Kulkarni',
      phone: '+919877770007',
      profileId: 'adv-pending-1',
      barEnrollment: 'MAH/5621/2023',
      stateBar: 'Bar Council of Maharashtra & Goa',
      exp: 2,
      practiceAreas: ['Cyber Law', 'Consumer Disputes'],
      courts: ['District Court Pune'],
      languages: ['English', 'Marathi', 'Hindi'],
      city: 'Pune',
      state: 'Maharashtra',
      fee: 1200.0,
      bio: 'New practitioner focusing on emerging cyber disputes and consumer electronics complaints.',
      status: 'pending',
      slots: [],
    },
  ];

  for (const adv of advocatesData) {
    insertUser.run(adv.userId, adv.email, advocateHash, adv.fullName, 'advocate', adv.phone);
    insertAdvocate.run(
      adv.profileId,
      adv.userId,
      adv.barEnrollment,
      adv.stateBar,
      adv.exp,
      JSON.stringify(adv.practiceAreas),
      JSON.stringify(adv.courts),
      JSON.stringify(adv.languages),
      adv.city,
      adv.state,
      adv.fee,
      adv.bio,
      adv.status
    );

    for (const slot of adv.slots) {
      insertSlot.run(slot.id, adv.profileId, slot.start, slot.end, slot.mode, 0);
    }
  }
}
