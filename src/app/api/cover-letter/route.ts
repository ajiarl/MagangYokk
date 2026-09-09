import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

const GROQ_API_KEY = process.env.GROQ_API_KEY

export async function POST(req: NextRequest) {
  try {
    if (!GROQ_API_KEY) {
      return NextResponse.json(
        { error: "GROQ_API_KEY belum dikonfigurasi di environment." },
        { status: 500 }
      )
    }

    const body = await req.json()
    const { jobId, lang = "id" } = body

    if (!jobId) {
      return NextResponse.json(
        { error: "Parameter jobId wajib diisi." },
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

    // 2. Ambil Profil Pelamar (Phase 1: 1 baris hardcoded Aji)
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .limit(1)
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        { error: "Profil pelamar tidak ditemukan di database." },
        { status: 404 }
      )
    }

    // 3. Susun Prompt Spesifik & Kontekstual (Strict Grounding, No Hallucination)
    const isEn = lang === "en"
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
      })
    })

    if (!groqRes.ok) {
      const errText = await groqRes.text()
      console.error("Groq API Error:", errText)
      return NextResponse.json(
        { error: `Gagal generate via Groq: ${groqRes.statusText}` },
        { status: 502 }
      )
    }

    const groqData = await groqRes.json()
    const draft = groqData.choices?.[0]?.message?.content || ""

    // 5. Upsert draft ke tabel applications di Supabase
    await supabase.from("applications").upsert(
      {
        job_id: job.id,
        profile_id: profile.id,
        status: "saved",
        cover_letter_draft: draft,
        cover_letter_lang: lang,
        updated_at: new Date().toISOString()
      },
      { onConflict: "job_id,profile_id" }
    )

    return NextResponse.json({
      success: true,
      draft,
      jobId: job.id
    })
  } catch (error: any) {
    console.error("Error generating cover letter:", error)
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    )
  }
}
