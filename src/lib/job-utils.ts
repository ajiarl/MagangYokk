import type { Job } from "./types"

export type JobEduCategory = "intern" | "freshgrad"

/**
 * Pure function to classify target education category for a job posting.
 * Distinguishes active university student internships ("intern") from
 * fresh graduate / entry-level opportunities ("freshgrad").
 */
export function getJobEduCategory(job: Pick<Job, "title" | "description">): JobEduCategory {
  const text = `${job.title} ${job.description || ""}`.toLowerCase()

  // Strong signals for active college / university student internship
  const isInternKeywords =
    text.includes("intern") ||
    text.includes("magang") ||
    text.includes("pkl") ||
    text.includes("student") ||
    text.includes("mahasiswa") ||
    text.includes("kuliah")

  // Strong signals for fresh graduates / degree holders
  const isGradKeywords =
    text.includes("fresh graduate") ||
    text.includes("freshgrad") ||
    text.includes("lulusan") ||
    text.includes("sarjana") ||
    text.includes("s1") ||
    text.includes("d3") ||
    text.includes("bachelor")

  if (isInternKeywords && !isGradKeywords) {
    return "intern"
  }
  if (isGradKeywords || (!isInternKeywords && (text.includes("junior") || text.includes("entry")))) {
    return "freshgrad"
  }
  return isInternKeywords ? "intern" : "freshgrad"
}
