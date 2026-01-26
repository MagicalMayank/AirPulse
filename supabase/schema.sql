/**
 * AirPulse Supabase Database Schema
 * 
 * ASSUMPTIONS:
 * 1. Email confirmation is DISABLED in Supabase Auth settings
 * 2. Three user roles: citizen, authority, analyst
 * 3. Internal IDs (authority_id, apa_id) are used for non-citizen logins
 * 4. Storage bucket 'complaints' is PUBLIC for reading complaint photos
 * 5. RLS uses auth.uid() for all user-specific operations
 * 
 * RUN THIS IN SUPABASE SQL EDITOR (Dashboard > SQL Editor)
 */

-- ============================================
-- 1. USERS TABLE (Profile data)
-- ============================================
-- This table stores user profile data linked to auth.users via id
-- The 'id' column MUST match the auth.users.id (UUID from Supabase Auth)

CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('citizen', 'authority', 'analyst')),
    name TEXT,                    -- For citizens (optional)
    email TEXT,                   -- For citizens (their actual email)
    authority_id TEXT UNIQUE,     -- For authority users (e.g., "DPCC-001")
    apa_id TEXT UNIQUE,           -- For analyst users (e.g., "APA-001")
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any (for clean re-run)
DROP POLICY IF EXISTS "Users can read own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;

-- Policy: Users can read their own profile
-- ASSUMPTION: Profile fetch happens after authentication
CREATE POLICY "Users can read own profile"
    ON public.users
    FOR SELECT
    USING (auth.uid() = id);

-- Policy: Users can insert their own profile (during signup)
-- ASSUMPTION: The app inserts profile with id = auth.uid() after auth.signUp()
CREATE POLICY "Users can insert own profile"
    ON public.users
    FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Policy: Users can update their own profile
CREATE POLICY "Users can update own profile"
    ON public.users
    FOR UPDATE
    USING (auth.uid() = id);

-- ============================================
-- 2. COMPLAINTS TABLE
-- ============================================
-- Stores pollution reports from citizens
-- user_id links to auth.users (the reporter)

CREATE TABLE IF NOT EXISTS public.complaints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'citizen',
    pollution_type TEXT NOT NULL,
    location_text TEXT NOT NULL,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    description TEXT NOT NULL,
    photo_url TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'resolved')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_complaints_user_id ON public.complaints(user_id);
CREATE INDEX IF NOT EXISTS idx_complaints_status ON public.complaints(status);
CREATE INDEX IF NOT EXISTS idx_complaints_created_at ON public.complaints(created_at DESC);

-- Enable RLS on complaints table
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any (for clean re-run)
DROP POLICY IF EXISTS "Anyone can read complaints" ON public.complaints;
DROP POLICY IF EXISTS "Authenticated users can insert complaints" ON public.complaints;
DROP POLICY IF EXISTS "Authority can update complaints" ON public.complaints;
DROP POLICY IF EXISTS "Users can update own complaints" ON public.complaints;

-- Policy: Anyone authenticated can read all complaints
-- ASSUMPTION: Complaint data is not private; authority dashboard needs to see all
CREATE POLICY "Anyone can read complaints"
    ON public.complaints
    FOR SELECT
    TO authenticated
    USING (true);

-- Policy: Authenticated users can insert complaints with their own user_id
-- CRITICAL: user_id must equal auth.uid() to prevent impersonation
CREATE POLICY "Authenticated users can insert complaints"
    ON public.complaints
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Policy: Authority users can update any complaint (for status changes)
-- ASSUMPTION: Authority role is checked via the users table
CREATE POLICY "Authority can update complaints"
    ON public.complaints
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
            AND users.role = 'authority'
        )
    );

-- Policy: Users can update their own complaints (e.g., add more details)
CREATE POLICY "Users can update own complaints"
    ON public.complaints
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id);

-- Trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_complaints_updated_at ON public.complaints;
CREATE TRIGGER update_complaints_updated_at
    BEFORE UPDATE ON public.complaints
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 3. REALTIME SUBSCRIPTIONS
-- ============================================
-- Enable realtime for complaints table so authority dashboard gets live updates

-- Add complaints table to realtime publication (ignore if already exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'complaints'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.complaints;
    END IF;
END $$;

-- ============================================
-- 4. STORAGE BUCKET FOR COMPLAINT PHOTOS
-- ============================================
-- Run these in SQL Editor - creates bucket and policies

-- Create the storage bucket (if not exists)
INSERT INTO storage.buckets (id, name, public)
VALUES ('complaints', 'complaints', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing storage policies if any
DROP POLICY IF EXISTS "Authenticated users can upload complaint photos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view complaint photos" ON storage.objects;

-- Policy: Authenticated users can upload to their own folder
-- Files are stored as: {user_id}/{filename}
CREATE POLICY "Authenticated users can upload complaint photos"
    ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'complaints'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

-- Policy: Anyone can view complaint photos (public bucket)
CREATE POLICY "Anyone can view complaint photos"
    ON storage.objects
    FOR SELECT
    TO public
    USING (bucket_id = 'complaints');

-- ============================================
-- 5. GRANT PERMISSIONS
-- ============================================
-- Ensure the anon and authenticated roles have proper access

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON public.complaints TO anon, authenticated;
GRANT INSERT, UPDATE ON public.complaints TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.users TO authenticated;

-- ============================================
-- VERIFICATION QUERIES (Run after setup)
-- ============================================
-- Uncomment and run these to verify setup:

-- Check tables exist:
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';

-- Check RLS is enabled:
-- SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';

-- Check policies:
-- SELECT * FROM pg_policies WHERE schemaname = 'public';

-- Check storage bucket:
-- SELECT * FROM storage.buckets WHERE id = 'complaints';
