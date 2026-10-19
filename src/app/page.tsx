import Link from "next/link"
import { MessageSquarePlus } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { Job, ApplicationStatus } from "@/lib/types"
import { JobFeedClient } from "@/components/job-feed-client"
import { AppHeader } from "@/components/app-header"
export const revalidate = 300


async function getPublicJobs(): Promise<(Job & { applicationStatus?: ApplicationStatus | null; applicationNotes?: string | null })[]> {
  const { data: jobs, error: jobsError } = await supabase
    .from("jobs")
    .select("*")
    .order("score", { ascending: false, nullsFirst: false })
    .order("scraped_at", { ascending: false })
    .limit(100)

  if (jobsError) {
    console.error("Supabase jobs query error:", jobsError)
    // Cegah kegagalan build statis saat CI/CD atau offline prerender jika database belum aktif
    if (process.env.NEXT_PHASE === "phase-production-build") {
      console.warn("Build-time notice: Database tidak dapat dijangkau saat prerender statis. Fallback draf kosong untuk build.")
      return []
    }

    throw new Error(
      `Gagal memuat daftar lowongan kerja dari database: ${jobsError.message || "Koneksi PostgREST terputus"}`
    )
  }

  return (jobs || []).map((job) => ({
    ...job,
    applicationStatus: null,
    applicationNotes: null,
  }))
}

function toSafeIsoDate(dateStr: string | null | undefined, fallbackDate: Date = new Date()): string {
  if (!dateStr) return fallbackDate.toISOString()
  const d = new Date(dateStr)
  return isNaN(d.getTime()) ? fallbackDate.toISOString() : d.toISOString()
}

export default async function Home() {
  const jobsWithApps = await getPublicJobs()

  const latestScrapedAt = jobsWithApps.reduce<string | null>((latest, job) => {
    if (!job.scraped_at) return latest
    if (!latest) return job.scraped_at
    return new Date(job.scraped_at) > new Date(latest) ? job.scraped_at : latest
  }, null)

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: jobsWithApps.map((job, index) => {
      const datePosted = toSafeIsoDate(job.scraped_at || job.created_at)
      const validThrough = job.expires_at
        ? toSafeIsoDate(job.expires_at)
        : new Date(new Date(datePosted).getTime() + 30 * 24 * 60 * 60 * 1000).toISOString()

      return {
        "@type": "ListItem",
        position: index + 1,
        item: {
          "@type": "JobPosting",
          title: job.title,
          description:
            job.description ||
            `Lowongan magang ${job.title} di ${job.company}. Temukan info lengkap dan lamar melalui MagangYokk.`,
          datePosted,
          validThrough,
          employmentType: "INTERN",
          hiringOrganization: {
            "@type": "Organization",
            name: job.company,
          },
          jobLocation: {
            "@type": "Place",
            address: {
              "@type": "PostalAddress",
              addressCountry: "ID",
              addressLocality: job.location || "Indonesia",
            },
          },
          ...(job.is_remote
            ? {
                jobLocationType: "TELECOMMUTE",
                applicantLocationRequirements: {
                  "@type": "Country",
                  name: "ID",
                },
              }
            : {}),
          directApply: true,
          url: job.url,
        },
      }
    }),
  }

  return (
    <div className="min-h-screen bg-[#08090a] text-[#f7f8f8] antialiased selection:bg-[#5e6ad2]/30 selection:text-white">
      {/* Header Sticky Linear Style - Client Authenticated & Guest Responsive */}
      <AppHeader
        totalJobs={jobsWithApps.length}
        latestScrapedAt={latestScrapedAt}
      />

      {/* Main Container - Edge-to-Edge Workspace */}
      <main className="w-full px-6 py-5">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
        />
        {/* Client Search, Filters, Tabs & Grid */}
        <JobFeedClient initialJobs={jobsWithApps} latestScrapedAt={latestScrapedAt} />
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
            <a
              href="https://github.com/ajiarlando/magangyokk/issues/new?title=%5BFeedback%2FBug%5D+&labels=feedback"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#8a8f98] hover:text-white transition-colors flex items-center gap-1.5"
            >
              <MessageSquarePlus className="w-3.5 h-3.5" />
              <span>Kritik & Saran / Lapor Bug</span>
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
