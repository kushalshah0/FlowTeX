-- Phase 1: Project collaborators, share links, and ownership

-- Fix owner_id to reference public.users instead of auth.users
ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_owner_id_fkey;
ALTER TABLE projects ADD CONSTRAINT projects_owner_id_fkey
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE;

-- Project collaborators
CREATE TABLE IF NOT EXISTS project_collaborators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'editor' CHECK (role IN ('owner', 'editor', 'viewer')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(project_id, user_id)
);

-- Project share links
CREATE TABLE IF NOT EXISTS project_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  token text UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  role text NOT NULL DEFAULT 'viewer' CHECK (role IN ('editor', 'viewer')),
  expires_at timestamptz,
  created_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_collaborators_project ON project_collaborators(project_id);
CREATE INDEX IF NOT EXISTS idx_collaborators_user ON project_collaborators(user_id);
CREATE INDEX IF NOT EXISTS idx_shares_token ON project_shares(token);

ALTER TABLE project_collaborators DISABLE ROW LEVEL SECURITY;
ALTER TABLE project_shares DISABLE ROW LEVEL SECURITY;

-- Storage policies for project-assets bucket (allow all authenticated operations)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Authenticated users can insert into project-assets') THEN
    CREATE POLICY "Authenticated users can insert into project-assets" ON storage.objects
      FOR INSERT WITH CHECK (bucket_id = 'project-assets');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Authenticated users can update project-assets') THEN
    CREATE POLICY "Authenticated users can update project-assets" ON storage.objects
      FOR UPDATE USING (bucket_id = 'project-assets');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Authenticated users can delete from project-assets') THEN
    CREATE POLICY "Authenticated users can delete from project-assets" ON storage.objects
      FOR DELETE USING (bucket_id = 'project-assets');
  END IF;
END $$;
