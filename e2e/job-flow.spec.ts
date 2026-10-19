import { test, expect } from "@playwright/test";

test.describe("MagangYokk Critical User Journey", () => {
  test("1. Beranda & Header: memuat halaman utama dan identitas MagangYokk (Tamu Publik)", async ({
    page,
  }) => {
    await page.goto("/");

    // Verifikasi Title tag
    await expect(page).toHaveTitle(/MagangYokk/i);

    // Verifikasi Brand Header
    const brandHeading = page.getByRole("heading", { name: "MagangYokk", level: 1 });
    await expect(brandHeading).toBeVisible();

    // Verifikasi Tombol Masuk di header kanan
    const masukBtn = page.getByRole("button", { name: /Masuk/i });
    await expect(masukBtn).toBeVisible();

    // Verifikasi Feedback Link di footer
    const feedbackLink = page.getByRole("link", {
      name: /Kritik & Saran \/ Lapor Bug/i,
    });
    await expect(feedbackLink).toBeVisible();
    await expect(feedbackLink).toHaveAttribute("target", "_blank");
  });

  test("2. Interaksi Pencarian & Filter Lowongan: filter posisi atau perusahaan dan tech stack", async ({
    page,
  }) => {
    await page.goto("/");

    // Cari input filter posisi
    const searchInput = page.getByPlaceholder(
      "Filter posisi atau perusahaan..."
    );
    await expect(searchInput).toBeVisible();

    // Ketik query pencarian
    await searchInput.fill("Frontend");
    await expect(searchInput).toHaveValue("Frontend");

    // Kosongkan kembali filter
    await searchInput.fill("");
    await expect(searchInput).toHaveValue("");

    // Klik tombol filter tag teknologi
    const nextBtn = page.getByRole("button", { name: "Next.js", exact: true });
    await expect(nextBtn).toBeVisible();
    await nextBtn.click();

    // Verifikasi tombol tag berstatus aktif dan tombol reset stack muncul
    await expect(nextBtn).toHaveClass(/bg-white/);
    const resetStackBtn = page.getByRole("button", { name: /Reset Stack/i });
    await expect(resetStackBtn).toBeVisible();

    // Reset kembali stack filter
    await resetStackBtn.click();
    await expect(resetStackBtn).not.toBeVisible();
  });

  test("3. Action Barrier & Pembukaan Dialog Auth (Deterministik)", async ({
    page,
  }) => {
    await page.goto("/");

    // 1. Buka modal auth via tombol header "Masuk"
    const masukBtn = page.getByRole("button", { name: /Masuk/i });
    await expect(masukBtn).toBeVisible();
    await masukBtn.click();

    // Heading modal auth wajib tampil deterministik
    const authHeading = page.getByRole("heading", { name: "Masuk ke MagangYokk" });
    await expect(authHeading).toBeVisible();

    // Input email dan tombol Google OAuth wajib tampil
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toBeVisible();

    const googleBtn = page.getByRole("button", { name: /Lanjutkan dengan Google/i });
    await expect(googleBtn).toBeVisible();

    // Tutup dialog modal
    const closeBtn = page.getByRole("button", { name: "Tutup dialog" });
    await closeBtn.click();
    await expect(authHeading).not.toBeVisible();

    // 2. Uji Action Barrier Cover Letter: klik Cover Letter sebagai tamu memicu Auth Modal
    const coverLetterBtn = page.getByRole("button", { name: /Cover Letter/i }).first();
    await expect(coverLetterBtn).toBeVisible();
    await coverLetterBtn.click();

    await expect(authHeading).toBeVisible();
    await expect(
      page.getByText("Masuk terlebih dahulu untuk membuat cover letter otomatis via AI.")
    ).toBeVisible();

    // Tutup modal
    await closeBtn.click();
    await expect(authHeading).not.toBeVisible();

    // 3. Uji Action Barrier CV Sync: klik CV sebagai tamu memicu Auth Modal
    const cvBtn = page.getByRole("button", { name: "CV", exact: true });
    await expect(cvBtn).toBeVisible();
    await cvBtn.click();

    await expect(authHeading).toBeVisible();
    await expect(
      page.getByText("Masuk terlebih dahulu untuk mengunggah resume.")
    ).toBeVisible();

    // Tutup kembali dialog modal
    await closeBtn.click();
    await expect(authHeading).not.toBeVisible();
  });

  test("4. Transisi Antarmuka: beralih antara Feed dan Kanban Board secara deterministik", async ({
    page,
  }) => {
    await page.goto("/");

    // Beralih ke tampilan Kanban Board
    const boardBtn = page.getByRole("button", { name: "Board" });
    await expect(boardBtn).toBeVisible();
    await boardBtn.click();

    // Verifikasi bahwa seluruh 5 kolom Kanban tampil
    const savedHeading = page.getByRole("heading", { name: "Disimpan" });
    await expect(savedHeading).toBeVisible();

    const appliedHeading = page.getByRole("heading", { name: "Sudah Dilamar" });
    await expect(appliedHeading).toBeVisible();

    const interviewHeading = page.getByRole("heading", { name: "Interview" });
    await expect(interviewHeading).toBeVisible();

    const offeredHeading = page.getByRole("heading", { name: "Penawaran" });
    await expect(offeredHeading).toBeVisible();

    const rejectedHeading = page.getByRole("heading", { name: "Ditolak" });
    await expect(rejectedHeading).toBeVisible();

    // Beralih kembali ke tampilan Feed
    const feedBtn = page.getByRole("button", { name: "Feed" });
    await expect(feedBtn).toBeVisible();
    await feedBtn.click();

    // Pastikan kartu-kartu loker di Feed terlihat kembali
    const firstCoverLetterBtn = page.getByRole("button", { name: /Cover Letter/i }).first();
    await expect(firstCoverLetterBtn).toBeVisible();
  });
});
