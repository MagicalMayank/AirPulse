-- =============================================
-- AIRPULSE FIX SCRIPT - Run this in Supabase SQL Editor
-- This script FIXES issues without recreating existing objects
-- =============================================

-- 1. ENSURE RLS IS DISABLED ON USERS TABLE (for debugging)
-- This is temporary to confirm RLS is the issue
ALTER TABLE IF EXISTS public.users DISABLE ROW LEVEL SECURITY;

-- 2. Drop ALL existing policies on users (they might be blocking)
DO $$ 
DECLARE 
    pol RECORD;
BEGIN
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'users' AND schemaname = 'public'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || pol.policyname || '" ON public.users';
    END LOOP;
END $$;

-- 3. Drop ALL existing policies on complaints
DO $$ 
DECLARE 
    pol RECORD;
BEGIN
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'complaints' AND schemaname = 'public'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || pol.policyname || '" ON public.complaints';
    END LOOP;
END $$;

-- 4. Temporarily disable RLS on complaints too
ALTER TABLE IF EXISTS public.complaints DISABLE ROW LEVEL SECURITY;

-- 5. Grant full access to authenticated users (for now)
GRANT ALL ON public.users TO authenticated;
GRANT ALL ON public.users TO anon;
GRANT ALL ON public.complaints TO authenticated;
GRANT ALL ON public.complaints TO anon;

-- 6. Verify tables exist and show their structure
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name IN ('users', 'complaints')
ORDER BY table_name, ordinal_position;
