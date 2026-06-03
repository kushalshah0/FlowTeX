-- Run this in Supabase SQL Editor to set up the project

-- 1. Create tables
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  owner_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS project_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  content text,
  type text NOT NULL DEFAULT 'tex',
  storage_url text,
  updated_at timestamptz DEFAULT now()
);

-- 2. Enable RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_files ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS policies (idempotent)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'projects' AND policyname = 'Users can manage their own projects') THEN
    CREATE POLICY "Users can manage their own projects" ON projects 
      FOR ALL USING (auth.uid() = owner_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'project_files' AND policyname = 'Users can manage their own project files') THEN
    CREATE POLICY "Users can manage their own project files" ON project_files
      FOR ALL USING (
        EXISTS (SELECT 1 FROM projects WHERE projects.id = project_files.project_id AND projects.owner_id = auth.uid())
      );
  END IF;
END $$;

-- 4. Create indexes
CREATE INDEX IF NOT EXISTS idx_project_files_project_id ON project_files(project_id);
CREATE INDEX IF NOT EXISTS idx_projects_owner_id ON projects(owner_id);

-- 5. Create storage bucket for project assets
INSERT INTO storage.buckets (id, name, public)
VALUES ('project-assets', 'project-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to project assets
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Public read access for project assets') THEN
    CREATE POLICY "Public read access for project assets" ON storage.objects
      FOR SELECT USING (bucket_id = 'project-assets');
  END IF;
END $$;
