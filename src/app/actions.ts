"use server"

import { headers } from "next/headers"
import { revalidatePath } from "next/cache"
import { createClient, type SupabaseServerClient } from "@/lib/supabase/server"
import { ApplicationStatus } from "@/lib/types"
import { recordAuditLog } from "@/lib/audit-trail"

const ALLOWED_STATUSES: readonly ApplicationStatus[] = [
  "saved",
  "applied",
  "interview",
  "offered",
  "rejected",
] as const

async function resolveAuthenticatedUserAndProfile(
  supabase: SupabaseServerClient
): Promise<{
  user: { id: string; email?: string; user_metadata?: Record<string, unknown> } | null
  profile: { id: string; full_name: string; skills: string[]; bio: string | null } | null
  error?: string
}> {

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return {
      user: null,
      profile: null,
      error: "Silakan masuk terlebih dahulu untuk mengelola lamaran.",
    }
  }

  let { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, skills, bio")
    .eq("user_id", user.id)
    .maybeSingle()

  // Auto-bootstrap profile jika user baru pertama kali login
  if (!profile) {
    const defaultName =
      (user.user_metadata?.full_name as string) ||
      user.email?.split("@")[0] ||
      "Kandidat Magang"
    const { data: newProfile, error: createError } = await supabase
      .from("profiles")
      .insert({
        user_id: user.id,
        full_name: defaultName,
        skills: [],
        score_threshold: 6.5,
      })
      .select("id, full_name, skills, bio")
      .single()

    if (createError || !newProfile) {
      console.error("Gagal auto-create profile:", createError)
      return { user, profile: null, error: "Gagal menginisialisasi profil pengguna." }
    }
    profile = newProfile
  }

  return { user, profile }
}

export async function getUserSessionAndApplications(): Promise<{
  user: { id: string; email?: string; fullName?: string } | null
  applications: Record<string, { status: ApplicationStatus; notes: string | null }>
}> {
  try {

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { user: null, applications: {} }
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("id, full_name")
      .eq("user_id", user.id)
      .maybeSingle()

    if (!profile) {
      return {
        user: {
          id: user.id,
          email: user.email,
          fullName:
            (user.user_metadata?.full_name as string) ||
            user.email?.split("@")[0] ||
            "Kandidat Magang",
        },
        applications: {},
      }
    }

    const { data: apps, error: appsError } = await supabase
      .from("applications")
      .select("job_id, status, notes")
      .eq("profile_id", profile.id)

    if (appsError) {
      console.error("Error fetching user applications:", appsError)
      return {
        user: {
          id: user.id,
          email: user.email,
          fullName: profile.full_name || user.email?.split("@")[0] || "Kandidat Magang",
        },
        applications: {},
      }
    }

    const mappedApps: Record<string, { status: ApplicationStatus; notes: string | null }> = {}
    if (apps) {
      for (const app of apps) {
        mappedApps[app.job_id] = {
          status: app.status as ApplicationStatus,
          notes: app.notes,
        }
      }
    }

    return {
      user: {
        id: user.id,
        email: user.email,
        fullName: profile.full_name || user.email?.split("@")[0] || "Kandidat Magang",
      },
      applications: mappedApps,
    }
  } catch (err) {
    console.error("getUserSessionAndApplications error:", err)
    return { user: null, applications: {} }
  }
}

export async function updateJobStatus(
  jobId: string,
  status: ApplicationStatus
): Promise<{ success: boolean; error?: string }> {
  try {
    const trimmedJobId = typeof jobId === "string" ? jobId.trim() : ""
    if (!trimmedJobId || trimmedJobId.length > 128) {
      return { success: false, error: "ID lowongan tidak valid." }
    }

    if (!ALLOWED_STATUSES.includes(status)) {
      return { success: false, error: "Status lamaran tidak valid." }
    }

    const supabase = await createClient()
    const { profile, error: authError } = await resolveAuthenticatedUserAndProfile(supabase)
    if (authError || !profile) {
      return { success: false, error: authError || "Profil tidak ditemukan." }
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

    const { error: dbError } = await supabase
      .from("applications")
      .upsert(payload, { onConflict: "job_id,profile_id" })

    if (dbError) {
      console.error("Gagal update status application:", dbError)
      return { success: false, error: dbError.message }
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
    const trimmedJobId = typeof jobId === "string" ? jobId.trim() : ""
    if (!trimmedJobId || trimmedJobId.length > 128) {
      return { success: false, error: "ID lowongan tidak valid." }
    }

    if (typeof notes !== "string") {
      return { success: false, error: "Catatan tidak valid." }
    }

    const validatedNotes = notes.trim().slice(0, 2000)

    const supabase = await createClient()
    const { profile, error: authError } = await resolveAuthenticatedUserAndProfile(supabase)
    if (authError || !profile) {
      return { success: false, error: authError || "Profil tidak ditemukan." }
    }

    const payload: Record<string, string> = {
      job_id: trimmedJobId,
      profile_id: profile.id,
      notes: validatedNotes,
      updated_at: new Date().toISOString(),
    }

    const { error: dbError } = await supabase
      .from("applications")
      .upsert(payload, { onConflict: "job_id,profile_id" })

    if (dbError) {
      console.error("Gagal update notes application:", dbError)
      return { success: false, error: dbError.message }
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
    const trimmedJobId = typeof jobId === "string" ? jobId.trim() : ""
    if (!trimmedJobId || trimmedJobId.length > 128) {
      return { success: false, error: "ID lowongan tidak valid." }
    }

    if (typeof draft !== "string") {
      return { success: false, error: "Draft cover letter tidak valid." }
    }

    const validatedDraft = draft.slice(0, 10000)

    const supabase = await createClient()
    const { profile, error: authError } = await resolveAuthenticatedUserAndProfile(supabase)
    if (authError || !profile) {
      return { success: false, error: authError || "Profil tidak ditemukan." }
    }

    const payload: Record<string, string> = {
      job_id: trimmedJobId,
      profile_id: profile.id,
      cover_letter_draft: validatedDraft,
      cover_letter_lang: lang === "en" ? "en" : "id",
      updated_at: new Date().toISOString(),
    }

    const { error: dbError } = await supabase
      .from("applications")
      .upsert(payload, { onConflict: "job_id,profile_id" })

    if (dbError) {
      console.error("Gagal update cover letter draft:", dbError)
      return { success: false, error: dbError.message }
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
