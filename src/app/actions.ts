"use server"

import { supabase } from "@/lib/supabase"
import { ApplicationStatus } from "@/lib/types"
import { revalidatePath } from "next/cache"

export async function updateJobStatus(jobId: string, status: ApplicationStatus) {
  try {
    // 1. Ambil profile Aji (Phase 1: hardcoded single profile)
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id")
      .limit(1)
      .single()

    if (profileError || !profile) {
      return { success: false, error: "Profil tidak ditemukan." }
    }

    // 2. Susun payload upsert
    const payload: Record<string, any> = {
      job_id: jobId,
      profile_id: profile.id,
      status: status,
      updated_at: new Date().toISOString()
    }

    // 3. Catat timestamp applied_at jika status berubah menjadi 'applied'
    if (status === "applied") {
      payload.applied_at = new Date().toISOString()
    }

    // 4. Upsert (create jika belum ada, update jika sudah ada)
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
