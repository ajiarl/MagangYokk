"use server"

import { supabase } from "@/lib/supabase"
import { ApplicationStatus } from "@/lib/types"
import { revalidatePath } from "next/cache"

export async function updateJobStatus(jobId: string, status: ApplicationStatus) {
  try {
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id")
      .limit(1)
      .single()

    if (profileError || !profile) {
      return { success: false, error: "Profil tidak ditemukan." }
    }

    const payload: Record<string, any> = {
      job_id: jobId,
      profile_id: profile.id,
      status: status,
      updated_at: new Date().toISOString()
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

    revalidatePath("/")
    return { success: true }
  } catch (err: any) {
    console.error("Server Action updateJobStatus error:", err)
    return { success: false, error: err.message || "Internal server error" }
  }
}

export async function updateApplicationNotes(jobId: string, notes: string) {
  try {
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id")
      .limit(1)
      .single()

    if (profileError || !profile) {
      return { success: false, error: "Profil tidak ditemukan." }
    }

    const payload: Record<string, any> = {
      job_id: jobId,
      profile_id: profile.id,
      notes: notes,
      updated_at: new Date().toISOString()
    }

    const { error } = await supabase
      .from("applications")
      .upsert(payload, { onConflict: "job_id,profile_id" })

    if (error) {
      console.error("Gagal update notes application:", error)
      return { success: false, error: error.message }
    }

    revalidatePath("/")
    return { success: true }
  } catch (err: any) {
    console.error("Server Action updateApplicationNotes error:", err)
    return { success: false, error: err.message || "Internal server error" }
  }
}
