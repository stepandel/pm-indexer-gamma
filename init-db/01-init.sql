-- Initialize database for Polymarket Indexer
-- This script runs when the PostgreSQL container starts for the first time

-- Create the public schema (should already exist but ensuring it's there)
CREATE SCHEMA IF NOT EXISTS public;

-- Set default privileges
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;