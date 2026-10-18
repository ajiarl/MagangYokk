import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { Job, ApplicationStatus } from "@/lib/types"
import { JobFeedClient } from "@/components/job-feed-client"
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
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle()

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
            <span className="text-[11px] font-mono text-[#8a8f98]">/</span>
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

      {/* Footer */}
      <footer className="w-full border-t border-white/[0.06] bg-[#08090a] mt-8 py-8 px-6 text-xs text-[#8a8f98]">
        <div className="w-full max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-white">MagangYokk</span>
            <span className="text-[#62666d]">•</span>
            <span className="font-mono text-[11px]">v0.2.0</span>
            <span className="text-[#62666d]">•</span>
            <span className="text-[11px] text-emerald-400/90 font-mono flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
              Data dilindungi UU PDP No. 27/2022
            </span>
          </div>

          <div className="flex items-center gap-6 font-mono text-[11px]">
            <Link href="/privacy" className="hover:text-white transition-colors">
              Kebijakan Privasi
            </Link>
            <Link href="/terms" className="hover:text-white transition-colors">
              Syarat & Ketentuan
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
