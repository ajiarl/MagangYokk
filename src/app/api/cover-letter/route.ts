import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { checkRateLimit, getClientIp } from "@/lib/rate-limit"

const GROQ_API_KEY = process.env.GROQ_API_KEY

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: "Silakan masuk terlebih dahulu untuk membuat cover letter." },
        { status: 401 }
      )
    }

    const clientIp = getClientIp(req)
    const rateLimit = checkRateLimit(`cover-letter:${clientIp}`, {
      limit: 5,
      windowMs: 60 * 1000,
    })

    if (!rateLimit.success) {
      const retryAfterSeconds = Math.max(1, Math.ceil((rateLimit.resetTime - Date.now()) / 1000))
      return NextResponse.json(
        { error: "Terlalu banyak permintaan pembuatan surat lamaran. Silakan tunggu 1 menit sebelum mencoba kembali." },
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

    if (!GROQ_API_KEY) {
      return NextResponse.json(
        { error: "GROQ_API_KEY belum dikonfigurasi di environment." },
        { status: 500 }
      )
    }

    const body = await req.json()
    const { jobId, lang, regenerate } = body

    if (!jobId || typeof jobId !== "string" || !jobId.trim()) {
      return NextResponse.json(
        { error: "Parameter jobId wajib diisi dengan ID valid." },
        { status: 400 }
      )
    }

    const validLangs = ["id", "en"] as const
    const selectedLang = lang ?? "id"
    if (!validLangs.includes(selectedLang)) {
      return NextResponse.json(
        { error: "Parameter lang harus bernilai 'id' atau 'en'." },
        { status: 400 }
      )
    }
    // 1. Ambil detail Job dari Supabase
    const { data: job, error: jobError } = await supabase
      .from("jobs")
      .select("*")
      .eq("id", jobId)
      .single()

    if (jobError || !job) {
      return NextResponse.json(
        { error: "Lowongan tidak ditemukan." },
        { status: 404 }
      )
    }

    // 2. Ambil Profil Pelamar berdasarkan user_id
    let { data: profile } = await supabase
      .from("profiles")
      .select("*")
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
        .select("*")
        .single()

      if (createError || !newProfile) {
        console.error("Gagal auto-create profile:", createError)
        return NextResponse.json(
          { error: "Profil pelamar tidak ditemukan di database." },
          { status: 404 }
        )
      }
      profile = newProfile
    }

    // 2b. Ambil status aplikasi eksisting (jika sudah pernah apply/melamar)
    const { data: existingApp } = await supabase
      .from("applications")
      .select("status, cover_letter_draft, cover_letter_lang")
      .eq("job_id", job.id)
      .eq("profile_id", profile.id)
      .maybeSingle()

    // Token Idempotency Check: jika draft sudah ada dengan bahasa yang sama dan tidak dipaksa regenerate
    if (!regenerate && existingApp?.cover_letter_draft && existingApp?.cover_letter_lang === selectedLang) {
      return NextResponse.json({
        success: true,
        draft: existingApp.cover_letter_draft,
        jobId: job.id,
        cached: true,
      })
    }

    // 3. Susun Prompt Spesifik & Kontekstual (Strict Grounding, No Hallucination)
    const isEn = selectedLang === "en"
    const systemPrompt = isEn
      ? `You are an expert tech career coach and professional copywriter specializing in developer internships and junior software engineering applications.
Your goal is to write a compelling, concise, and authentic cover letter / cold email tailored specifically to the job description and candidate's real skills.

STRICT FACTUAL INTEGRITY RULE:
- ONLY reference technical skills, background, and projects that are EXPLICITLY mentioned in the candidate's profile.
- NEVER invent, extrapolate, or hallucinate specific experiences, features, tools, or architectures (e.g. do not claim experience with WebSockets, Realtime Channels, Telemetry, CI/CD, or IoT unless explicitly stated in the candidate's skills or bio).
- If a job mentions a technology the candidate does not have in their profile, focus on the candidate's actual matching stack and their eagerness to learn, rather than falsely claiming direct experience.

Tone: Professional, enthusiastic, humble yet capable, direct to the point. No excessive flattery or generic filler.`
      : `Kamu adalah career coach dan copywriter profesional khusus posisi magang dan junior developer IT.
Tugasmu adalah menyusun Cover Letter / Cold Email lamaran kerja yang padat, meyakinkan, otentik, dan langsung nyambung antara kualifikasi kandidat dengan kebutuhan lowongan.

ATURAN KETAT INTEGRITAS FAKTA (ANTI-HALUSINASI):
- HANYA gunakan keahlian teknis, latar belakang, dan portofolio yang SECARA EKSPLISIT tercantum di data profil kandidat.
- DILARANG KERAS mengarang atau menambahkan detail pengalaman teknis spesifik (misalnya mengklaim pernah konfigurasi Realtime Channels, WebSockets, Telemetri, IoT, Microservices, dsb) jika tidak ada di profil kandidat, meskipun teknologi tersebut disebut di deskripsi lowongan.
- Jika lowongan meminta sesuatu yang tidak ada di profil kandidat, tonjolkan stack yang benar-benar cocok dan kemampuan adaptasi/belajar cepat, JANGAN berpura-pura sudah ahli di bidang tersebut.

Gaya bahasa: Profesional santun, percaya diri berbasis fakta nyata, tidak bertele-tele, bebas dari basa-basi klise ("Dengan surat ini saya bermaksud..."). Langsung tunjukkan value nyata.`

    const userPrompt = `
KANDIDAT:
- Nama: ${profile.full_name}
- Skill Utama: ${profile.skills?.join(", ") || "Next.js, React, Laravel, TypeScript, Supabase, MySQL"}
- Portfolio: ${profile.portfolio_url || "https://ajiarlando.my.id"}
- GitHub: ${profile.github_url || "https://github.com/ajiarlando"}
- Bio / Background Singkat: ${profile.bio || "Mahasiswa Sistem Informasi aktif membangun aplikasi web modern"}

LOWONGAN:
- Posisi: ${job.title}
- Perusahaan: ${job.company}
- Lokasi: ${job.location || (job.is_remote ? "Remote" : "Indonesia")}
- Deskripsi / Requirement:
${job.description || "Tidak ada deskripsi detail lowongan."}

INSTRUKSI:
1. Bahasa: ${isEn ? "English" : "Bahasa Indonesia yang baik dan profesional"}.
2. Struktur:
   - Subject Email (cantumkan di baris paling atas, format: "Subject: [Posisi] - [Nama Kandidat]")
   - Pembuka yang langsung menyebutkan posisi dan alasan tertarik pada perusahaan/proyek mereka
   - 1-2 paragraf yang menyoroti proyek nyata kandidat yang relevan dengan kebutuhan teknologi mereka
   - Call to action (kesediaan diskusi teknis/interview) dan link portofolio
   - Salam penutup
3. Maksimal 250-300 kata. Langsung berikan teks suratnya tanpa komentar pembuka atau penutup dari AI.
`

    // 4. Request ke Groq API langsung via native fetch (OpenAI-compatible)
    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "qwen/qwen3.8-27b",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.6,
        max_tokens: 1024
      }),
      signal: AbortSignal.timeout(20000)
    })

    if (!groqRes.ok) {
      const errText = await groqRes.text()
      console.error("Groq API Error:", errText)
      return NextResponse.json(
        { error: "Layanan AI cover letter sedang mengalami kendala atau sibuk. Silakan coba beberapa saat lagi." },
        { status: 502 }
      )
    }

    const groqData = await groqRes.json()
    const draft = groqData.choices?.[0]?.message?.content || ""

    // 5. Upsert draft ke tabel applications di Supabase dengan pengecekan dbError eksplisit
    const { error: dbError } = await supabase.from("applications").upsert(
      {
        job_id: job.id,
        profile_id: profile.id,
        status: existingApp?.status ?? "saved",
        cover_letter_draft: draft,
        cover_letter_lang: selectedLang,
        updated_at: new Date().toISOString()
      },
      { onConflict: "job_id,profile_id" }
    )

    if (dbError) {
      console.error("Gagal menyimpan cover letter ke database:", dbError)
      return NextResponse.json(
        { error: `Gagal menyimpan cover letter ke database: ${dbError.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      draft,
      jobId: job.id
    })
  } catch (error: unknown) {
    if (
      error instanceof Error &&
      (error.name === "TimeoutError" ||
        error.name === "AbortError" ||
        error.message.toLowerCase().includes("timeout"))
    ) {
      return NextResponse.json(
        { error: "Layanan AI membutuhkan waktu terlalu lama (batas waktu 20 detik terlampaui). Silakan coba lagi." },
        { status: 504 }
      )
    }
    console.error("Error generating cover letter:", error)
    return NextResponse.json(
      { error: "Terjadi kesalahan internal saat membuat cover letter." },
      { status: 500 }
    )
  }
}
