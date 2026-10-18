import { describe, it, expect } from "vitest"
import { getJobEduCategory } from "@/lib/job-utils"

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
  })
})
