-- Disables RLS for demo mode
ALTER TABLE projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE project_files DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own projects" ON projects;
DROP POLICY IF EXISTS "Users can manage their own project files" ON project_files;

-- Users table for username/password auth
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  password_salt text NOT NULL,
  role text NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Seed admin user (password: "password")
INSERT INTO users (username, password_hash, password_salt, role)
VALUES (
  'admin',
  '6b95e2ee39ada20323ce2ff263834bc66580a4273fefee362c40dbc12fc061d22576864019a3aee4593776346b6880f8b5c057c8736127972c4811f4914fc0c1',
  '10e9a05f323fbb8f42cb8b95f91c24c4',
  'admin'
)
ON CONFLICT (username) DO NOTHING;
