// Type definitions untuk MagangYokk
// Mirror dari schema Supabase — update kalau schema berubah

export type ApplicationStatus = 'saved' | 'applied' | 'interview' | 'offered' | 'rejected'

export interface Job {
  id: string
  title: string
  company: string
  location: string | null
  is_remote: boolean
  is_paid: boolean | null
  description: string | null
  url: string
  source: string
  score: number | null
  score_breakdown: Record<string, boolean> | null
  scraped_at: string
  expires_at: string | null
  created_at: string
}

export interface Profile {
  id: string
  user_id: string | null
  full_name: string
  skills: string[]
  preferred_roles: string[]
  location_pref: string | null
  allow_remote: boolean
  require_paid: boolean
  score_threshold: number
  portfolio_url: string | null
  github_url: string | null
  bio: string | null
  created_at: string
  updated_at: string
}

export interface Application {
  id: string
  job_id: string
  profile_id: string
  status: ApplicationStatus
  cover_letter_draft: string | null
  cover_letter_lang: 'id' | 'en'
  applied_at: string | null
  notes: string | null
  created_at: string
  updated_at: string
  // Joined fields (optional)
  job?: Job
}
