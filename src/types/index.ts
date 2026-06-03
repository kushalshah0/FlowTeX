export interface ProjectFile {
  id: string
  project_id: string
  file_name: string
  content: string | null
  type: "tex" | "bib" | "asset"
  storage_url: string | null
  updated_at: string
}

export interface Project {
  id: string
  name: string
  owner_id: string | null
  created_at: string
  updated_at: string
}
