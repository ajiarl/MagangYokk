import { supabase } from "@/lib/supabase"
import { Job, ApplicationStatus } from "@/lib/types"
import { JobFeedClient } from "@/components/job-feed-client"
import { Sparkles, Terminal } from "lucide-react"

export const revalidate = 0

async function getJobsWithApplications(): Promise<(Job & { applicationStatus?: ApplicationStatus | null; applicationNotes?: string | null })[]> {
  const { data: jobs, error: jobsError } = await supabase
    .from("jobs")
    .select("*")
    .order("score", { ascending: false, nullsFirst: false })
    .order("scraped_at", { ascending: false })
    .limit(100)

  if (jobsError || !jobs) return []

  const { data: applications } = await supabase
    .from("applications")
    .select("job_id, status, notes")

  const appMap = new Map<string, { status: ApplicationStatus; notes: string | null }>()
  if (applications) {
    applications.forEach((app) => {
      appMap.set(app.job_id, {
        status: app.status as ApplicationStatus,
        notes: app.notes || null
      })
    })
  }

  return jobs.map((job) => {
    const userApp = appMap.get(job.id)
    return {
      ...job,
      applicationStatus: userApp?.status || null,
      applicationNotes: userApp?.notes || null
    }
  })
}

async function getProfile() {
  const { data } = await supabase
    .from("profiles")
    .select("full_name, skills, score_threshold")
    .limit(1)
    .single()

  return data
}

export default async function Home() {
  const [jobsWithApps, profile] = await Promise.all([
    getJobsWithApplications(),
    getProfile()
  ])

  return (
    <div className="min-h-screen bg-[#08090a] text-[#f7f8f8] antialiased selection:bg-[#5e6ad2]/30 selection:text-white">
      {/* Header Sticky Linear Style - Full Width Fluid Canvas */}
      <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#08090a]/90 backdrop-blur-md">
        <div className="w-full px-6 h-12 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-[13px] tracking-tight text-[#f7f8f8]">MagangYokk</span>
            <span className="text-[11px] font-mono text-[#62666d]">/</span>
            <span className="text-xs text-[#8a8f98] font-mono">{jobsWithApps.length} opportunities</span>
          </div>

          {profile && (
            <div className="flex items-center gap-3">
              <span className="text-xs text-[#8a8f98] font-mono">{profile.full_name}</span>
              <div className="w-6 h-6 rounded-full bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-[10px] font-mono text-[#d0d6e0]">
                A
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main Container - Edge-to-Edge Workspace */}
      <main className="w-full px-6 py-5">
        {/* Client Search, Filters, Tabs & Grid */}
        <JobFeedClient initialJobs={jobsWithApps} />
      </main>
    </div>
  )
}
