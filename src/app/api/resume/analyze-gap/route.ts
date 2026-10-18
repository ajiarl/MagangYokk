import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { checkRateLimit, getClientIp } from "@/lib/rate-limit"
interface GapAnalysisResponse {
  matchScore: number
  matchedSkills: string[]
  missingSkills: string[]
  keyStrengths: string[]
  growthAdvice: string
  verdict: string
}

function extractJson(text: string): Record<string, unknown> {
  try {
    return JSON.parse(text)
  } catch {
    const match = text.match(/\{[\s\S]*\}/)
    if (match) {
      return JSON.parse(match[0])
    }
    throw new Error("Format output AI tidak mengandung JSON valid.")
  }
}

export async function POST(req: NextRequest) {
  try {
    const clientIp = getClientIp(req)
    const rateLimit = checkRateLimit(`analyze-gap:${clientIp}`, {
      limit: 5,
      windowMs: 60 * 1000,
    })

    if (!rateLimit.success) {
      const retryAfterSeconds = Math.max(1, Math.ceil((rateLimit.resetTime - Date.now()) / 1000))
      return NextResponse.json(
        { error: "Terlalu banyak permintaan analisis profil. Silakan tunggu 1 menit sebelum mencoba kembali." },
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

    const { jobId } = await req.json()

    if (!jobId || typeof jobId !== "string" || !jobId.trim()) {
      return NextResponse.json({ error: "Parameter jobId wajib diisi dengan ID valid." }, { status: 400 })
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
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle()
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
        model: "llama-3.3-70b-versatile",
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ]
      }),
      signal: AbortSignal.timeout(25000)
    })

    if (!groqRes.ok) {
      const errText = await groqRes.text()
      console.error("Groq API error:", errText)
      return NextResponse.json(
        { error: "Layanan analisis AI sedang sibuk atau tidak dapat dihubungi. Silakan coba beberapa saat lagi." },
        { status: 502 }
      )
    }

    const groqData = await groqRes.json()
    const content = groqData.choices?.[0]?.message?.content || "{}"

    let parsedAnalysis: GapAnalysisResponse
    try {
      const raw = extractJson(content)
      parsedAnalysis = {
        matchScore: typeof raw.matchScore === "number" ? Math.max(0, Math.min(100, Math.round(raw.matchScore))) : 50,
        matchedSkills: Array.isArray(raw.matchedSkills) ? raw.matchedSkills.map(String) : [],
        missingSkills: Array.isArray(raw.missingSkills) ? raw.missingSkills.map(String) : [],
        keyStrengths: Array.isArray(raw.keyStrengths) ? raw.keyStrengths.map(String) : [],
        growthAdvice: typeof raw.growthAdvice === "string" ? raw.growthAdvice : "Tingkatkan relevansi portfolio dengan kebutuhan lowongan.",
        verdict: typeof raw.verdict === "string" ? raw.verdict : "Analisis profil selesai diproses."
      }
    } catch (parseErr) {
      console.error("Failed to parse AI output:", content, parseErr)
      return NextResponse.json(
        { error: "Format respons dari AI tidak valid. Silakan coba kembali." },
        { status: 502 }
      )
    }

    return NextResponse.json({
      success: true,
      analysis: parsedAnalysis
    })
  } catch (err: unknown) {
    console.error("Gap Analysis error:", err)
    return NextResponse.json(
      { error: "Terjadi kesalahan internal saat memproses analisis resume." },
      { status: 500 }
    )
  }
}
