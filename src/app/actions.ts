"use server"

import { headers } from "next/headers"
import { revalidatePath } from "next/cache"
import { supabase } from "@/lib/supabase"
import { ApplicationStatus } from "@/lib/types"
import { recordAuditLog } from "@/lib/audit-trail"

const ALLOWED_STATUSES: readonly ApplicationStatus[] = [
  "saved",
  "applied",
  "interview",
  "offered",
  "rejected",
] as const

async function isRequestAuthorized(): Promise<boolean> {
  try {
    const headerList = await headers()
    const internalSecret = process.env.INTERNAL_ACTION_SECRET
    if (internalSecret) {
      const providedSecret = headerList.get("x-action-secret")
      if (providedSecret === internalSecret) return true
    }
    const host = headerList.get("x-forwarded-host") || headerList.get("host")
    const origin = headerList.get("origin")
    const referer = headerList.get("referer")

    if (!host) {
      return false
    }

    if (!origin && !referer) {
      return false
    }

    if (origin) {
      try {
        const originHost = new URL(origin).host
        if (originHost !== host) {
          return false
        }
      } catch {
        return false
      }
    }

    if (referer) {
      try {
        const refererHost = new URL(referer).host
        if (refererHost !== host) {
          return false
        }
      } catch {
        return false
      }
    }

    return true
  } catch {
    return false
  }
}

async function resolveAuthenticatedProfile(): Promise<{ id: string } | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle()

  if (error || !data) {
    console.error("Gagal resolve authenticated profile:", error)
    return null
  }
  return data
}

export async function updateJobStatus(
  jobId: string,
  status: ApplicationStatus
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!(await isRequestAuthorized())) {
      return { success: false, error: "Akses ditolak atau input tidak valid." }
    }

    const trimmedJobId = typeof jobId === "string" ? jobId.trim() : ""
    if (!trimmedJobId || trimmedJobId.length > 128) {
      return { success: false, error: "Akses ditolak atau input tidak valid." }
    }

    if (!ALLOWED_STATUSES.includes(status)) {
      return { success: false, error: "Akses ditolak atau input tidak valid." }
    }

    const profile = await resolveAuthenticatedProfile()
    if (!profile) {
      return { success: false, error: "Profil tidak ditemukan." }
    }

    const payload: Record<string, string | ApplicationStatus> = {
      job_id: trimmedJobId,
      profile_id: profile.id,
      status: status,
      updated_at: new Date().toISOString(),
    }

    if (status === "applied") {
      payload.applied_at = new Date().toISOString()
    }

    const { error } = await supabase
      .from("applications")
      .upsert(payload, { onConflict: "job_id,profile_id" })

    if (error) {
      console.error("Gagal update status application:", error)
      return { success: false, error: error.message }
    }
    const headerList = await headers()
    const rawIp = headerList.get("x-forwarded-for")?.split(",")[0] || headerList.get("x-real-ip")
    await recordAuditLog({
      actionType: "STATUS_CHANGE",
      entityId: trimmedJobId,
      payloadSummary: { status },
      rawIp,
    })

    revalidatePath("/")
    return { success: true }
  } catch (err: unknown) {
    console.error("Server Action updateJobStatus error:", err)
    const message = err instanceof Error ? err.message : "Internal server error"
    return { success: false, error: message }
  }
}

export async function updateApplicationNotes(
  jobId: string,
  notes: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!(await isRequestAuthorized())) {
      return { success: false, error: "Akses ditolak atau input tidak valid." }
    }

    const trimmedJobId = typeof jobId === "string" ? jobId.trim() : ""
    if (!trimmedJobId || trimmedJobId.length > 128) {
      return { success: false, error: "Akses ditolak atau input tidak valid." }
    }

    if (typeof notes !== "string") {
      return { success: false, error: "Akses ditolak atau input tidak valid." }
    }

    const validatedNotes = notes.trim().slice(0, 2000)

    const profile = await resolveAuthenticatedProfile()
    if (!profile) {
      return { success: false, error: "Profil tidak ditemukan." }
    }

    const payload: Record<string, string> = {
      job_id: trimmedJobId,
      profile_id: profile.id,
      notes: validatedNotes,
      updated_at: new Date().toISOString(),
    }

    const { error } = await supabase
      .from("applications")
      .upsert(payload, { onConflict: "job_id,profile_id" })

    if (error) {
      console.error("Gagal update notes application:", error)
      return { success: false, error: error.message }
    }
    const headerList = await headers()
    const rawIp = headerList.get("x-forwarded-for")?.split(",")[0] || headerList.get("x-real-ip")
    await recordAuditLog({
      actionType: "NOTE_UPDATE",
      entityId: trimmedJobId,
      payloadSummary: { notesLength: validatedNotes.length },
      rawIp,
    })

    revalidatePath("/")
    return { success: true }
  } catch (err: unknown) {
    console.error("Server Action updateApplicationNotes error:", err)
    const message = err instanceof Error ? err.message : "Internal server error"
    return { success: false, error: message }
  }
}

export async function updateCoverLetterDraft(
  jobId: string,
  draft: string,
  lang: "id" | "en" = "id"
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!(await isRequestAuthorized())) {
      return { success: false, error: "Akses ditolak atau input tidak valid." }
    }

    const trimmedJobId = typeof jobId === "string" ? jobId.trim() : ""
    if (!trimmedJobId || trimmedJobId.length > 128) {
      return { success: false, error: "Akses ditolak atau input tidak valid." }
    }

    if (typeof draft !== "string") {
      return { success: false, error: "Akses ditolak atau input tidak valid." }
    }

    const validatedDraft = draft.slice(0, 10000)

    const profile = await resolveAuthenticatedProfile()
    if (!profile) {
      return { success: false, error: "Profil tidak ditemukan." }
    }

    const payload: Record<string, string> = {
      job_id: trimmedJobId,
      profile_id: profile.id,
      cover_letter_draft: validatedDraft,
      cover_letter_lang: lang === "en" ? "en" : "id",
      updated_at: new Date().toISOString(),
    }

    const { error } = await supabase
      .from("applications")
      .upsert(payload, { onConflict: "job_id,profile_id" })

    if (error) {
      console.error("Gagal update cover letter draft:", error)
      return { success: false, error: error.message }
    }

    const headerList = await headers()
    const rawIp = headerList.get("x-forwarded-for")?.split(",")[0] || headerList.get("x-real-ip")
    await recordAuditLog({
      actionType: "COVER_LETTER_UPDATE",
      entityId: trimmedJobId,
      payloadSummary: { draftLength: validatedDraft.length, lang },
      rawIp,
    })

    revalidatePath("/")
    return { success: true }
  } catch (err: unknown) {
    console.error("Server Action updateCoverLetterDraft error:", err)
    const message = err instanceof Error ? err.message : "Internal server error"
    return { success: false, error: message }
  }
}
