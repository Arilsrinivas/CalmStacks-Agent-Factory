-- CalmStacks Database Schema Contract Template
-- Database Agent owns this contract. Backend and QA agents rely on it.

-- Migration: V001__initial_schema.sql
BEGIN TRANSACTION;

CREATE TABLE IF NOT EXISTS system_metadata (
    id VARCHAR(64) PRIMARY KEY,
    key_name VARCHAR(128) NOT NULL UNIQUE,
    value_payload TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_system_metadata_key ON system_metadata(key_name);

COMMIT;
