import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

interface GapAnalysisResponse {
  matchScore: number
  matchedSkills: string[]
  missingSkills: string[]
  keyStrengths: string[]
  growthAdvice: string
  verdict: string
}

export async function POST(req: NextRequest) {
  try {
    const { jobId } = await req.json()

    if (!jobId) {
      return NextResponse.json({ error: "jobId wajib disertakan." }, { status: 400 })
    }

    // 1. Ambil data lowongan
    const { data: job, error: jobError } = await supabase
      .from("jobs")
      .select("id, title, company, description, is_remote, location")
      .eq("id", jobId)
      .single()

    if (jobError || !job) {
      return NextResponse.json({ error: "Lowongan tidak ditemukan." }, { status: 404 })
    }

    // 2. Ambil profile Aji (skills & bio/resume text)
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, full_name, skills, bio")
      .limit(1)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: "Profil tidak ditemukan." }, { status: 404 })
    }

    const apiKey = process.env.GROQ_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: "GROQ_API_KEY belum dikonfigurasi." }, { status: 500 })
    }

    const systemPrompt = `Anda adalah Senior Tech Career Consultant & Technical Auditor yang objektif, kritis, dan jujur.
Tugas Anda: Melakukan Gap Analysis (analisis kecocokan dan kesenjangan skill) antara Resume/Profil Pengembang dengan Deskripsi Lowongan Kerja.

ATURAN KETAT (ANTI-HALUSINASI & FACTUAL GROUNDING):
1. HANYA gunakan keahlian dan riwayat nyata yang tertera pada Profil/Resume Pengembang.
2. JANGAN mengarang pengalaman yang tidak ada.
3. KELUARKAN OUTPUT DALAM FORMAT JSON VALID TANPA MARKDOWN DAN TANPA BACKTICKS:
{
  "matchScore": number (0 - 100),
  "matchedSkills": ["skill1", "skill2"],
  "missingSkills": ["skill_yang_dibutuhkan_tapi_belum_ada_di_cv"],
  "keyStrengths": ["poin keunggulan spesifik"],
  "growthAdvice": "Saran konkret hal apa yang harus dipelajari atau disiapkan untuk interview",
  "verdict": "Rekomendasi singkat (e.g. Sangat Cocok / Cocok dengan Catatan / Kurang Cocok)"
}`

    const userPrompt = `PROFIL & RESUME KANDIDAT:
Nama: ${profile.full_name}
Keahlian Terdaftar: ${JSON.stringify(profile.skills)}
Isi Resume / Bio:
${profile.bio || "Belum ada teks resume detail."}

DESKRIPSI LOWONGAN:
Posisi: ${job.title}
Perusahaan: ${job.company}
Lokasi: ${job.is_remote ? "Remote" : job.location || "Indonesia"}
Deskripsi Lowongan:
${job.description || "Tidak ada deskripsi detail."}

Analisis kesesuaian profil dan keluarkan JSON valid sekarang:`

    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "qwen/qwen3.8-27b",
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ]
      })
    })

    if (!groqRes.ok) {
      const errText = await groqRes.text()
      console.error("Groq API error:", errText)
      return NextResponse.json({ error: "Gagal memproses analisis AI: " + errText }, { status: 500 })
    }

    const groqData = await groqRes.json()
    const content = groqData.choices[0]?.message?.content || "{}"
    const parsedAnalysis: GapAnalysisResponse = JSON.parse(content)

    return NextResponse.json({
      success: true,
      analysis: parsedAnalysis
    })
  } catch (err: any) {
    console.error("Gap Analysis error:", err)
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 })
  }
}
