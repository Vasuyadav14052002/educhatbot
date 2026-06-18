-- PostgreSQL initialization script
-- Creates extensions needed by the application

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- For fuzzy text search on student names
CREATE EXTENSION IF NOT EXISTS "btree_gin"; -- For composite GIN indexes
