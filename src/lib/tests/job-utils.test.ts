import { describe, it, expect } from "vitest"
import { getJobEduCategory, getScoreBadgeClasses, formatRelativeTime } from "@/lib/job-utils"

describe("getJobEduCategory", () => {
  describe("Kelompok A: Deteksi Sinyal Magang Mahasiswa (Internship Signals)", () => {
    it("1. Mendeteksi kata kunci 'intern' di judul", () => {
      const result = getJobEduCategory({
        title: "Frontend Developer Intern",
        description: null,
      })
      expect(result).toBe("intern")
    })

    it("2. Mendeteksi kata kunci 'magang' di judul", () => {
      const result = getJobEduCategory({
        title: "Magang Web Developer 2026",
        description: "Membantu pengembangan fitur aplikasi.",
      })
      expect(result).toBe("intern")
    })

    it("3. Mendeteksi kata kunci 'pkl' di judul", () => {
      const result = getJobEduCategory({
        title: "Lowongan PKL Teknik Informatika",
        description: "Praktek Kerja Lapangan untuk SMK/Mahasiswa.",
      })
      expect(result).toBe("intern")
    })

    it("4. Mendeteksi kata kunci 'student' di judul", () => {
      const result = getJobEduCategory({
        title: "Software Engineering Student Trainee",
        description: "Program pelatihan teknik perangkat lunak.",
      })
      expect(result).toBe("intern")
    })

    it("5. Mendeteksi kata kunci 'mahasiswa' di judul", () => {
      const result = getJobEduCategory({
        title: "Dicari Mahasiswa IT Magang",
        description: "Fleksibel dengan jadwal perkuliahan.",
      })
      expect(result).toBe("intern")
    })

    it("6. Mendeteksi kata kunci 'kuliah' di judul", () => {
      const result = getJobEduCategory({
        title: "Program Kerja Praktik Kuliah Semester Akhir",
        description: "Disediakan uang saku dan sertifikat.",
      })
      expect(result).toBe("intern")
    })

    it("7. Mendeteksi sinyal magang jika hanya ada di description", () => {
      const result = getJobEduCategory({
        title: "Full Stack Developer",
        description: "Terbuka untuk program magang mahasiswa aktif.",
      })
      expect(result).toBe("intern")
    })
  })

  describe("Kelompok B: Deteksi Sinyal Fresh Graduate & Entry Level", () => {
    it("8. Mendeteksi kata kunci 'fresh graduate' di judul", () => {
      const result = getJobEduCategory({
        title: "Backend Engineer - Fresh Graduate",
        description: "Membangun REST API performa tinggi.",
      })
      expect(result).toBe("freshgrad")
    })

    it("9. Mendeteksi kata kunci 'freshgrad' di judul", () => {
      const result = getJobEduCategory({
        title: "QA Engineer (Freshgrad Welcome)",
        description: "Manual dan automated testing.",
      })
      expect(result).toBe("freshgrad")
    })

    it("10. Mendeteksi kata kunci 'lulusan' di judul", () => {
      const result = getJobEduCategory({
        title: "Program Lulusan Baru IT Support",
        description: "Mendukung infrastruktur hardware dan jaringan.",
      })
      expect(result).toBe("freshgrad")
    })

    it("11. Mendeteksi kata kunci 'sarjana' di judul", () => {
      const result = getJobEduCategory({
        title: "Program Sarjana Komputer Junior Developer",
        description: "Rekrutmen talenta lulusan universitas terkemuka.",
      })
      expect(result).toBe("freshgrad")
    })

    it("12. Mendeteksi kata kunci 's1' di judul", () => {
      const result = getJobEduCategory({
        title: "Junior DevOps Engineer (Min. S1)",
        description: "Pemahaman dasar Docker dan CI/CD pipeline.",
      })
      expect(result).toBe("freshgrad")
    })

    it("13. Mendeteksi kata kunci 'd3' di judul", () => {
      const result = getJobEduCategory({
        title: "IT Helpdesk Specialist (D3 / S1)",
        description: "Troubleshooting perangkat pengguna kantor.",
      })
      expect(result).toBe("freshgrad")
    })

    it("14. Mendeteksi kata kunci 'bachelor' di judul", () => {
      const result = getJobEduCategory({
        title: "Bachelor Degree Associate Software Engineer",
        description: "Position designed for graduates in Computer Science.",
      })
      expect(result).toBe("freshgrad")
    })

    it("15. Mendeteksi kata kunci 'junior' di judul", () => {
      const result = getJobEduCategory({
        title: "Junior React Developer",
        description: "Membangun komponen UI web modern.",
      })
      expect(result).toBe("freshgrad")
    })

    it("16. Mendeteksi kata kunci 'entry' di judul", () => {
      const result = getJobEduCategory({
        title: "Entry Level Data Analyst",
        description: "Mengolah visualisasi dashboard SQL dan PowerBI.",
      })
      expect(result).toBe("freshgrad")
    })
  })

  describe("Kelompok C: Robustness, Boundary & Edge Cases", () => {
    it("17. Menangani description bernilai null secara aman", () => {
      const result = getJobEduCategory({
        title: "Mobile App Intern",
        description: null,
      })
      expect(result).toBe("intern")
    })

    it("18. Menangani description berupa string kosong", () => {
      const result = getJobEduCategory({
        title: "UI/UX Designer Intern",
        description: "",
      })
      expect(result).toBe("intern")
    })

    it("19. Menangani karakter simbolik / markdown acak pada judul", () => {
      const result = getJobEduCategory({
        title: "=== [INTERN] Web Developer (React.js) !!! ===",
        description: "## Responsibilities: Coding and learning",
      })
      expect(result).toBe("intern")
    })

    it("20. Menangani insensitivitas huruf besar-kecil (case insensitivity)", () => {
      const result = getJobEduCategory({
        title: "FRONTEND DEVELOPER INTERNSHIP - MAHASISWA",
        description: "TERBUKA UNTUK KULIAH TINGKAT AKHIR",
      })
      expect(result).toBe("intern")
    })

    it("21. Menangani judul dan deskripsi netral tanpa sinyal eksplisit (fallback)", () => {
      const result = getJobEduCategory({
        title: "Product Designer",
        description: "Mendesain flow aplikasi dan interaksi pengguna.",
      })
      expect(result).toBe("freshgrad")
    })

    it("22. Menangani judul campuran (sinyal magang + gelar kelulusan) di mana gelar mendominasi", () => {
      const result = getJobEduCategory({
        title: "Web Developer Intern",
        description: "Kualifikasi minimal lulusan S1 atau Sarjana.",
      })
      expect(result).toBe("freshgrad")
    })

    it("23. Mengutamakan 'intern' jika mengandung kata kunci magang mahasiswa meskipun terdapat kata 's1' atau 'd3'", () => {
      const result = getJobEduCategory({
        title: "Frontend Intern",
        description: "Terbuka untuk mahasiswa aktif S1 semester 6 yang ingin belajar Next.js.",
      })
      expect(result).toBe("intern")
    })

    it("24. Mengutamakan 'intern' untuk mahasiswa aktif D3 semester akhir", () => {
      const result = getJobEduCategory({
        title: "Internship Mobile Developer",
        description: "Dicari mahasiswa aktif D3 semester akhir jurusan Teknik Informatika.",
      })
      expect(result).toBe("intern")
    })

    it("25. Mengutamakan 'intern' untuk frasa 'program sarjana' bagi mahasiswa aktif", () => {
      const result = getJobEduCategory({
        title: "Frontend Intern",
        description: "Mahasiswa aktif program sarjana semester 6",
      })
      expect(result).toBe("intern")
    })

    it("26. Mengabaikan fresh graduate ketika terdapat frasa negasi 'bukan fresh graduate'", () => {
      const result = getJobEduCategory({
        title: "Frontend Intern",
        description: "Khusus mahasiswa aktif, bukan fresh graduate",
      })
      expect(result).toBe("intern")
    })
  })
})

describe("getScoreBadgeClasses", () => {
  it("mengembalikan kelas emerald untuk skor >= 7.0", () => {
    const emerald = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
    expect(getScoreBadgeClasses(7.0)).toBe(emerald)
    expect(getScoreBadgeClasses(7.5)).toBe(emerald)
    expect(getScoreBadgeClasses(9.8)).toBe(emerald)
    expect(getScoreBadgeClasses(10)).toBe(emerald)
  })

  it("mengembalikan kelas amber untuk skor antara 5.0 dan 6.9", () => {
    const amber = "bg-amber-500/10 text-amber-400 border-amber-500/20"
    expect(getScoreBadgeClasses(5.0)).toBe(amber)
    expect(getScoreBadgeClasses(5.5)).toBe(amber)
    expect(getScoreBadgeClasses(6.9)).toBe(amber)
    expect(getScoreBadgeClasses(6.99)).toBe(amber)
  })

  it("mengembalikan kelas muted zinc untuk skor < 5.0", () => {
    const muted = "bg-white/[0.03] text-[#8a8f98] border-white/[0.06]"
    expect(getScoreBadgeClasses(4.9)).toBe(muted)
    expect(getScoreBadgeClasses(3.0)).toBe(muted)
    expect(getScoreBadgeClasses(0)).toBe(muted)
    expect(getScoreBadgeClasses(-2)).toBe(muted)
  })

  it("mengembalikan kelas muted zinc untuk null, undefined, dan NaN", () => {
    const muted = "bg-white/[0.03] text-[#8a8f98] border-white/[0.06]"
    expect(getScoreBadgeClasses(null)).toBe(muted)
    expect(getScoreBadgeClasses(undefined)).toBe(muted)
    expect(getScoreBadgeClasses(NaN)).toBe(muted)
  })
})

describe("formatRelativeTime", () => {
  const baseNow = new Date("2025-10-20T12:00:00.000Z")

  it("mengembalikan 'Belum ada data' untuk input null, undefined, atau string tidak valid", () => {
    expect(formatRelativeTime(null, baseNow)).toBe("Belum ada data")
    expect(formatRelativeTime(undefined, baseNow)).toBe("Belum ada data")
    expect(formatRelativeTime("", baseNow)).toBe("Belum ada data")
    expect(formatRelativeTime("invalid-date-string", baseNow)).toBe("Belum ada data")
  })

  it("mengembalikan 'Baru saja' untuk selisih waktu < 1 menit atau masa depan", () => {
    const thirtySecAgo = new Date(baseNow.getTime() - 30 * 1000).toISOString()
    const justNow = baseNow.toISOString()
    const futureTime = new Date(baseNow.getTime() + 10 * 1000).toISOString()

    expect(formatRelativeTime(thirtySecAgo, baseNow)).toBe("Baru saja")
    expect(formatRelativeTime(justNow, baseNow)).toBe("Baru saja")
    expect(formatRelativeTime(futureTime, baseNow)).toBe("Baru saja")
  })

  it("mengembalikan 'N menit lalu' untuk selisih 1 hingga 59 menit", () => {
    const oneMinAgo = new Date(baseNow.getTime() - 60 * 1000).toISOString()
    const fifteenMinAgo = new Date(baseNow.getTime() - 15 * 60 * 1000).toISOString()
    const fiftyNineMinAgo = new Date(baseNow.getTime() - 59 * 60 * 1000).toISOString()

    expect(formatRelativeTime(oneMinAgo, baseNow)).toBe("1 menit lalu")
    expect(formatRelativeTime(fifteenMinAgo, baseNow)).toBe("15 menit lalu")
    expect(formatRelativeTime(fiftyNineMinAgo, baseNow)).toBe("59 menit lalu")
  })

  it("mengembalikan 'N jam lalu' untuk selisih 1 hingga 23 jam", () => {
    const oneHourAgo = new Date(baseNow.getTime() - 60 * 60 * 1000).toISOString()
    const fiveHoursAgo = new Date(baseNow.getTime() - 5 * 3600 * 1000).toISOString()
    const twentyThreeHoursAgo = new Date(baseNow.getTime() - 23 * 3600 * 1000).toISOString()

    expect(formatRelativeTime(oneHourAgo, baseNow)).toBe("1 jam lalu")
    expect(formatRelativeTime(fiveHoursAgo, baseNow)).toBe("5 jam lalu")
    expect(formatRelativeTime(twentyThreeHoursAgo, baseNow)).toBe("23 jam lalu")
  })

  it("mengembalikan 'N hari lalu' untuk selisih 1 hingga 6 hari", () => {
    const oneDayAgo = new Date(baseNow.getTime() - 24 * 3600 * 1000).toISOString()
    const threeDaysAgo = new Date(baseNow.getTime() - 3 * 24 * 3600 * 1000).toISOString()
    const sixDaysAgo = new Date(baseNow.getTime() - 6 * 24 * 3600 * 1000).toISOString()

    expect(formatRelativeTime(oneDayAgo, baseNow)).toBe("1 hari lalu")
    expect(formatRelativeTime(threeDaysAgo, baseNow)).toBe("3 hari lalu")
    expect(formatRelativeTime(sixDaysAgo, baseNow)).toBe("6 hari lalu")
  })

  it("mengembalikan format tanggal lokal Indonesia untuk selisih >= 7 hari", () => {
    const sevenDaysAgo = new Date("2025-10-13T12:00:00.000Z").toISOString()
    const formatted = formatRelativeTime(sevenDaysAgo, baseNow)
    expect(formatted).toMatch(/13 Okt/)
  })
})
