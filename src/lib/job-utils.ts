import type { Job } from "./types"

export type JobEduCategory = "intern" | "freshgrad"

/**
 * Pure function to classify target education category for a job posting.
 * Distinguishes active university student internships ("intern") from
 * fresh graduate / entry-level opportunities ("freshgrad").
 */
export function getJobEduCategory(job: Pick<Job, "title" | "description">): JobEduCategory {
  const text = `${job.title} ${job.description || ""}`.toLowerCase()

  // Deteksi frasa mahasiswa sarjana (merujuk pada mahasiswa aktif jenjang S1)
  const hasStudentSarjana =
    text.includes("program sarjana") ||
    text.includes("jenjang sarjana") ||
    text.includes("kuliah sarjana") ||
    text.includes("mahasiswa sarjana")

  // Sinyal kuat magang mahasiswa aktif
  const isInternKeywords =
    text.includes("intern") ||
    text.includes("magang") ||
    text.includes("pkl") ||
    text.includes("student") ||
    text.includes("mahasiswa") ||
    text.includes("kuliah") ||
    text.includes("semester") ||
    hasStudentSarjana

  // Bersihkan frasa negasi fresh graduate dan frasa mahasiswa sarjana
  // agar tidak keliru memicu kata kunci kelulusan
  const textForGradCheck = text
    .replace(/bukan\s+(?:untuk\s+)?fresh\s*graduate/g, "")
    .replace(/tidak\s+(?:untuk\s+)?fresh\s*graduate/g, "")
    .replace(/not\s+for\s+fresh\s*graduate/g, "")
    .replace(/bukan\s+(?:untuk\s+)?freshgrad/g, "")
    .replace(/tidak\s+(?:untuk\s+)?freshgrad/g, "")
    .replace(/not\s+for\s+freshgrad/g, "")
    .replace(/bukan\s+(?:untuk\s+)?lulusan/g, "")
    .replace(/tidak\s+(?:untuk\s+)?lulusan/g, "")
    .replace(/program\s+sarjana/g, "")
    .replace(/jenjang\s+sarjana/g, "")
    .replace(/kuliah\s+sarjana/g, "")
    .replace(/mahasiswa\s+sarjana/g, "")

  // Sinyal spesifik kualifikasi lulusan / sarjana
  const isExplicitGradKeywords =
    textForGradCheck.includes("fresh graduate") ||
    textForGradCheck.includes("freshgrad") ||
    textForGradCheck.includes("lulusan") ||
    textForGradCheck.includes("sarjana")

  // Jenjang pendidikan formal (bisa berlaku untuk mahasiswa aktif maupun lulusan)
  const isDegreeKeywords =
    text.includes("s1") ||
    text.includes("d3") ||
    text.includes("bachelor")

  // Utamakan "intern" jika mengandung kata kunci magang mahasiswa, meskipun terdapat kata "s1" atau "d3"
  if (isInternKeywords) {
    if (isExplicitGradKeywords) {
      return "freshgrad"
    }
    return "intern"
  }

  if (
    isExplicitGradKeywords ||
    isDegreeKeywords ||
    text.includes("junior") ||
    text.includes("entry")
  ) {
    return "freshgrad"
  }

  return "freshgrad"
}

/**
 * Returns semantic Tailwind color classes for a job match score badge.
 * - >= 7.0: Emerald (Strong match)
 * - 5.0 - 6.9: Amber (Moderate match)
 * - < 5.0 or null/undefined: Zinc/Muted (Low match)
 */
export function getScoreBadgeClasses(score: number | null | undefined): string {
  if (score === null || score === undefined || isNaN(score) || score < 5.0) {
    return "bg-white/[0.03] text-[#8a8f98] border-white/[0.06]"
  }
  if (score >= 7.0) {
    return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
  }
  return "bg-amber-500/10 text-amber-400 border-amber-500/20"
}

/**
 * Formats an ISO date string into Indonesian relative time (e.g. "Baru saja", "5 menit lalu", "2 jam lalu", "3 hari lalu", "19 Okt").
 * Safe against null, undefined, and invalid date formats.
 */
export function formatRelativeTime(dateStr: string | null | undefined, now: Date = new Date()): string {
  if (!dateStr) return "Belum ada data"
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return "Belum ada data"

  const diffMs = now.getTime() - d.getTime()
  if (diffMs < 60_000) {
    return "Baru saja"
  }
  const diffMin = Math.floor(diffMs / 60_000)
  if (diffMin < 60) {
    return `${diffMin} menit lalu`
  }
  const diffHour = Math.floor(diffMin / 60)
  if (diffHour < 24) {
    return `${diffHour} jam lalu`
  }
  const diffDay = Math.floor(diffHour / 24)
  if (diffDay < 7) {
    return `${diffDay} hari lalu`
  }
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "short" })
}
