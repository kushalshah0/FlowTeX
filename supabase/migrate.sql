-- Run this in Supabase SQL Editor after setup.sql
-- Disables RLS for demo mode (no Supabase Auth session)

ALTER TABLE projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE project_files DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own projects" ON projects;
DROP POLICY IF EXISTS "Users can manage their own project files" ON project_files;
