/**
 * SQLite DDL Schema definition corresponding 1:1 to contracts/schema.sql
 */

export const DDL_SCHEMA = `
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('client', 'advocate', 'admin')),
  phone TEXT NOT NULL UNIQUE,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

CREATE TABLE IF NOT EXISTS advocate_profiles (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  bar_council_enrollment TEXT NOT NULL UNIQUE,
  state_bar_council TEXT NOT NULL,
  experience_years INTEGER NOT NULL DEFAULT 0 CHECK (experience_years >= 0),
  practice_areas TEXT NOT NULL DEFAULT '[]',
  courts TEXT NOT NULL DEFAULT '[]',
  languages TEXT NOT NULL DEFAULT '[]',
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  consultation_fee REAL NOT NULL DEFAULT 0.00 CHECK (consultation_fee >= 0),
  bio TEXT,
  verification_status TEXT NOT NULL DEFAULT 'pending' 
    CHECK (verification_status IN ('pending', 'verified', 'rejected', 'suspended')),
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_advocate_profiles_user_id ON advocate_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_advocate_profiles_verification_status ON advocate_profiles(verification_status);
CREATE INDEX IF NOT EXISTS idx_advocate_profiles_city ON advocate_profiles(city);
CREATE INDEX IF NOT EXISTS idx_advocate_profiles_consultation_fee ON advocate_profiles(consultation_fee);

CREATE TABLE IF NOT EXISTS case_intakes (
  id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  raw_problem_description TEXT NOT NULL,
  preferred_language TEXT NOT NULL DEFAULT 'en',
  status TEXT NOT NULL DEFAULT 'submitted' 
    CHECK (status IN ('draft', 'submitted', 'linked_to_consultation', 'closed')),
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_case_intakes_client_id ON case_intakes(client_id);
CREATE INDEX IF NOT EXISTS idx_case_intakes_status ON case_intakes(status);

CREATE TABLE IF NOT EXISTS ai_intake_summaries (
  id TEXT PRIMARY KEY,
  intake_id TEXT NOT NULL UNIQUE REFERENCES case_intakes(id) ON DELETE CASCADE,
  facts_summary TEXT NOT NULL,
  parties_involved TEXT NOT NULL DEFAULT '{}',
  key_relief_sought TEXT NOT NULL,
  suggested_practice_areas TEXT NOT NULL DEFAULT '[]',
  disclaimer_accepted INTEGER NOT NULL DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_ai_intake_summaries_intake_id ON ai_intake_summaries(intake_id);

CREATE TABLE IF NOT EXISTS consultation_slots (
  id TEXT PRIMARY KEY,
  advocate_id TEXT NOT NULL REFERENCES advocate_profiles(id) ON DELETE CASCADE,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  mode TEXT NOT NULL DEFAULT 'video' 
    CHECK (mode IN ('audio', 'video', 'in_person')),
  is_booked INTEGER NOT NULL DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_consultation_slots_advocate_id ON consultation_slots(advocate_id);
CREATE INDEX IF NOT EXISTS idx_consultation_slots_start_time ON consultation_slots(start_time);
CREATE INDEX IF NOT EXISTS idx_consultation_slots_lookup ON consultation_slots(advocate_id, is_booked, start_time);

CREATE TABLE IF NOT EXISTS consultations (
  id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  advocate_id TEXT NOT NULL REFERENCES advocate_profiles(id) ON DELETE CASCADE,
  slot_id TEXT NOT NULL UNIQUE REFERENCES consultation_slots(id) ON DELETE RESTRICT,
  scheduled_at TEXT NOT NULL,
  mode TEXT NOT NULL CHECK (mode IN ('audio', 'video', 'in_person')),
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'requested' 
    CHECK (status IN ('requested', 'confirmed', 'reschedule_offered', 'declined', 'completed', 'cancelled')),
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_consultations_client_id ON consultations(client_id);
CREATE INDEX IF NOT EXISTS idx_consultations_advocate_id ON consultations(advocate_id);
CREATE INDEX IF NOT EXISTS idx_consultations_status ON consultations(status);

CREATE TABLE IF NOT EXISTS case_workspaces (
  id TEXT PRIMARY KEY,
  consultation_id TEXT NOT NULL UNIQUE REFERENCES consultations(id) ON DELETE CASCADE,
  client_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  advocate_id TEXT NOT NULL REFERENCES advocate_profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' 
    CHECK (status IN ('active', 'advisory_issued', 'closed')),
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_case_workspaces_client_id ON case_workspaces(client_id);
CREATE INDEX IF NOT EXISTS idx_case_workspaces_advocate_id ON case_workspaces(advocate_id);
CREATE INDEX IF NOT EXISTS idx_case_workspaces_status ON case_workspaces(status);

CREATE TABLE IF NOT EXISTS case_documents (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES case_workspaces(id) ON DELETE CASCADE,
  uploaded_by_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size_bytes INTEGER NOT NULL CHECK (file_size_bytes > 0),
  mime_type TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_case_documents_workspace_id ON case_documents(workspace_id);
CREATE INDEX IF NOT EXISTS idx_case_documents_uploader ON case_documents(uploaded_by_user_id);

CREATE TABLE IF NOT EXISTS workspace_messages (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES case_workspaces(id) ON DELETE CASCADE,
  sender_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message_text TEXT NOT NULL,
  attachments TEXT NOT NULL DEFAULT '[]',
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_workspace_messages_workspace_id ON workspace_messages(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workspace_messages_created_at ON workspace_messages(created_at);
`;
