-- ============================================================================
-- CalmStacks Machine-Readable Database Contract
-- System: LegalConnect (MVP v1.0)
-- File: contracts/schema.sql
-- Jurisdiction: Republic of India
-- Engine: PostgreSQL 16+ (Portable DDL with SQLite translation notes)
-- ============================================================================

BEGIN TRANSACTION;

-- ----------------------------------------------------------------------------
-- 1. Users Table
-- Core authentication and identity table with role partitioning
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(64) PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(32) NOT NULL CHECK (role IN ('client', 'advocate', 'admin')),
    phone VARCHAR(32) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- ----------------------------------------------------------------------------
-- 2. Advocate Profiles Table
-- BCI Rule 36 compliant factual professional profiles
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS advocate_profiles (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    bar_council_enrollment VARCHAR(128) NOT NULL UNIQUE,
    state_bar_council VARCHAR(255) NOT NULL,
    experience_years INTEGER NOT NULL DEFAULT 0 CHECK (experience_years >= 0),
    practice_areas TEXT[] NOT NULL DEFAULT '{}',
    courts TEXT[] NOT NULL DEFAULT '{}',
    languages TEXT[] NOT NULL DEFAULT '{}',
    city VARCHAR(128) NOT NULL,
    state VARCHAR(128) NOT NULL,
    consultation_fee NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (consultation_fee >= 0),
    bio TEXT,
    verification_status VARCHAR(32) NOT NULL DEFAULT 'pending' 
        CHECK (verification_status IN ('pending', 'verified', 'rejected', 'suspended')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_advocate_profiles_user_id ON advocate_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_advocate_profiles_verification_status ON advocate_profiles(verification_status);
CREATE INDEX IF NOT EXISTS idx_advocate_profiles_city ON advocate_profiles(city);
CREATE INDEX IF NOT EXISTS idx_advocate_profiles_consultation_fee ON advocate_profiles(consultation_fee);

-- ----------------------------------------------------------------------------
-- 3. Case Intakes Table
-- Raw conversational dispute intake submitted by citizens/MSMEs
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS case_intakes (
    id VARCHAR(64) PRIMARY KEY,
    client_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    raw_problem_description TEXT NOT NULL,
    preferred_language VARCHAR(32) NOT NULL DEFAULT 'en',
    status VARCHAR(32) NOT NULL DEFAULT 'submitted' 
        CHECK (status IN ('draft', 'submitted', 'linked_to_consultation', 'closed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_case_intakes_client_id ON case_intakes(client_id);
CREATE INDEX IF NOT EXISTS idx_case_intakes_status ON case_intakes(status);

-- ----------------------------------------------------------------------------
-- 4. AI Intake Summaries Table
-- Structured factual summaries extracted by AI; strictly non-legal-advice
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ai_intake_summaries (
    id VARCHAR(64) PRIMARY KEY,
    intake_id VARCHAR(64) NOT NULL UNIQUE REFERENCES case_intakes(id) ON DELETE CASCADE,
    facts_summary TEXT NOT NULL,
    parties_involved JSONB NOT NULL DEFAULT '{}'::jsonb,
    key_relief_sought TEXT NOT NULL,
    suggested_practice_areas TEXT[] NOT NULL DEFAULT '{}',
    disclaimer_accepted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ai_intake_summaries_intake_id ON ai_intake_summaries(intake_id);

-- ----------------------------------------------------------------------------
-- 5. Consultation Slots Table
-- Available calendar windows published by enrolled advocates
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS consultation_slots (
    id VARCHAR(64) PRIMARY KEY,
    advocate_id VARCHAR(64) NOT NULL REFERENCES advocate_profiles(id) ON DELETE CASCADE,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    mode VARCHAR(32) NOT NULL DEFAULT 'video' 
        CHECK (mode IN ('audio', 'video', 'in_person')),
    is_booked BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_consultation_slots_advocate_id ON consultation_slots(advocate_id);
CREATE INDEX IF NOT EXISTS idx_consultation_slots_start_time ON consultation_slots(start_time);
CREATE INDEX IF NOT EXISTS idx_consultation_slots_lookup ON consultation_slots(advocate_id, is_booked, start_time);

-- ----------------------------------------------------------------------------
-- 6. Consultations Table
-- Formal legal advisory bookings connecting client, advocate, and slot
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS consultations (
    id VARCHAR(64) PRIMARY KEY,
    client_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    advocate_id VARCHAR(64) NOT NULL REFERENCES advocate_profiles(id) ON DELETE CASCADE,
    slot_id VARCHAR(64) NOT NULL UNIQUE REFERENCES consultation_slots(id) ON DELETE RESTRICT,
    scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
    mode VARCHAR(32) NOT NULL CHECK (mode IN ('audio', 'video', 'in_person')),
    notes TEXT,
    status VARCHAR(32) NOT NULL DEFAULT 'requested' 
        CHECK (status IN ('requested', 'confirmed', 'reschedule_offered', 'declined', 'completed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_consultations_client_id ON consultations(client_id);
CREATE INDEX IF NOT EXISTS idx_consultations_advocate_id ON consultations(advocate_id);
CREATE INDEX IF NOT EXISTS idx_consultations_status ON consultations(status);

-- ----------------------------------------------------------------------------
-- 7. Case Workspaces Table
-- Persistent collaborative space provisioned for consultation participants
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS case_workspaces (
    id VARCHAR(64) PRIMARY KEY,
    consultation_id VARCHAR(64) NOT NULL UNIQUE REFERENCES consultations(id) ON DELETE CASCADE,
    client_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    advocate_id VARCHAR(64) NOT NULL REFERENCES advocate_profiles(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'active' 
        CHECK (status IN ('active', 'advisory_issued', 'closed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_case_workspaces_client_id ON case_workspaces(client_id);
CREATE INDEX IF NOT EXISTS idx_case_workspaces_advocate_id ON case_workspaces(advocate_id);
CREATE INDEX IF NOT EXISTS idx_case_workspaces_status ON case_workspaces(status);

-- ----------------------------------------------------------------------------
-- 8. Case Documents Table
-- Encrypted document vault records attached to a case workspace
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS case_documents (
    id VARCHAR(64) PRIMARY KEY,
    workspace_id VARCHAR(64) NOT NULL REFERENCES case_workspaces(id) ON DELETE CASCADE,
    uploaded_by_user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_url VARCHAR(1024) NOT NULL,
    file_size_bytes BIGINT NOT NULL CHECK (file_size_bytes > 0),
    mime_type VARCHAR(128) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_case_documents_workspace_id ON case_documents(workspace_id);
CREATE INDEX IF NOT EXISTS idx_case_documents_uploader ON case_documents(uploaded_by_user_id);

-- ----------------------------------------------------------------------------
-- 9. Workspace Messages Table
-- Privileged, chronological communications within a case workspace
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS workspace_messages (
    id VARCHAR(64) PRIMARY KEY,
    workspace_id VARCHAR(64) NOT NULL REFERENCES case_workspaces(id) ON DELETE CASCADE,
    sender_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message_text TEXT NOT NULL,
    attachments JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_workspace_messages_workspace_id ON workspace_messages(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workspace_messages_created_at ON workspace_messages(created_at);

COMMIT;
