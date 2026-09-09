import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
// @ts-ignore
import pdfParse from "pdf-parse-fork"

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json({ error: "File PDF resume tidak ditemukan." }, { status: 400 })
    }

    if (!file.name.toLowerCase().endsWith(".pdf")) {
      return NextResponse.json({ error: "Format file wajib PDF." }, { status: 400 })
    }

    // Convert File to ArrayBuffer & Buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

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
  } catch (err: any) {
    console.error("Resume upload error:", err)
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 })
  }
}
