import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
// @ts-expect-error pdf-parse-fork lacks bundled type definitions
import pdfParse from "pdf-parse-fork"

export async function POST(req: NextRequest) {
  try {
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

    // Ambil profile Aji
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .limit(1)
      .single()

    if (profile) {
      // Simpan bio / resume_raw_text ke Supabase
      await supabase
        .from("profiles")
        .update({
          bio: rawText.slice(0, 5000),
          updated_at: new Date().toISOString()
        })
        .eq("id", profile.id)
    }

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
