import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { recordAuditLog } from "@/lib/audit-trail"
import { checkRateLimit, getClientIp } from "@/lib/rate-limit"
// @ts-expect-error pdf-parse-fork lacks bundled type definitions
import pdfParse from "pdf-parse-fork"

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: "Silakan masuk terlebih dahulu untuk mengunggah resume." },
        { status: 401 }
      )
    }
    const clientIp = getClientIp(req)
    const rateLimit = checkRateLimit(`resume-upload:${clientIp}`, {
      limit: 3,
      windowMs: 600 * 1000,
    })

    if (!rateLimit.success) {
      const retryAfterSeconds = Math.max(1, Math.ceil((rateLimit.resetTime - Date.now()) / 1000))
      return NextResponse.json(
        { error: "Batas unggah resume tercapai (maks 3 kali per 10 menit). Silakan coba lagi nanti." },
        {
          status: 429,
          headers: {
            "Retry-After": retryAfterSeconds.toString(),
            "X-RateLimit-Limit": rateLimit.limit.toString(),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": Math.ceil(rateLimit.resetTime / 1000).toString(),
          },
        }
      )
    }
    const formData = await req.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json({ error: "File PDF resume tidak ditemukan." }, { status: 400 })
    }
    const MAX_FILE_SIZE = 10 * 1024 * 1024
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "Ukuran file melebihi batas maksimal 10 MB." },
        { status: 413 }
      )
    }

    const hasPdfExt = file.name.toLowerCase().endsWith(".pdf")
    const isPdfMime = file.type === "application/pdf" || file.type === "application/x-pdf"
    if (!hasPdfExt || !isPdfMime) {
      return NextResponse.json(
        { error: "Format file wajib dokumen PDF (.pdf)." },
        { status: 400 }
      )
    }

    // Convert File to ArrayBuffer & Buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Verify PDF Magic Bytes (%PDF)
    const isMagicPdf = buffer.subarray(0, 4).toString("utf-8") === "%PDF"
    if (!isMagicPdf) {
      return NextResponse.json(
        { error: "File bukan dokumen PDF yang valid." },
        { status: 400 }
      )
    }

    // Parse PDF text
    const parsed = await pdfParse(buffer)
    const rawText = parsed.text ? parsed.text.trim() : ""

    if (!rawText || rawText.length < 50) {
      return NextResponse.json({
        error: "Gagal membaca teks dari PDF. Pastikan bukan PDF hasil scan/gambar murni."
      }, { status: 400 })
    }

    // Ambil profile berdasarkan user_id
    let { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle()

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
        .select("id")
        .single()

      if (createError || !newProfile) {
        console.error("Gagal auto-create profile saat upload resume:", createError)
        return NextResponse.json(
          { error: "Gagal menginisialisasi profil pengguna." },
          { status: 500 }
        )
      }
      profile = newProfile
    }

    // Simpan bio / resume_raw_text ke Supabase dengan explicit error check
    const { error: dbError } = await supabase
      .from("profiles")
      .update({
        bio: rawText.slice(0, 5000),
        updated_at: new Date().toISOString(),
      })
      .eq("id", profile.id)

    if (dbError) {
      console.error("Gagal menyimpan resume ke profil database:", dbError)
      return NextResponse.json(
        { error: `Gagal menyimpan resume ke database: ${dbError.message}` },
        { status: 500 }
      )
    }

    await recordAuditLog({
      actionType: "RESUME_UPLOAD",
      entityId: profile.id,
      payloadSummary: {
        fileName: file.name,
        fileSize: file.size,
        textLength: rawText.length,
      },
      rawIp: clientIp,
    })

    return NextResponse.json({
      success: true,
      textLength: rawText.length,
      preview: rawText.slice(0, 300) + "..."
    })
  } catch (err: unknown) {
    console.error("Resume upload error:", err)
    return NextResponse.json(
      { error: "Gagal memproses file resume. Pastikan file PDF tidak terenkripsi atau korup." },
      { status: 500 }
    )
  }
}
