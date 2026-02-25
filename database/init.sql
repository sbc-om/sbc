-- =============================================
-- SBC Database Initialization
-- This file runs ONLY on first PostgreSQL start
-- (when the data volume is empty).
-- =============================================

-- Enable useful extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";   -- trigram index for fuzzy text search
CREATE EXTENSION IF NOT EXISTS "citext";    -- case-insensitive text type

-- The application auto-creates all tables on first connection
-- via ensureSchema() in src/lib/db/postgres.ts.
-- This file only ensures the database and extensions exist.
