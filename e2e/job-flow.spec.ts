import { test, expect } from "@playwright/test";

test.describe("MagangYokk Critical User Journey", () => {
  test("1. Beranda & Header: memuat halaman utama dan identitas MagangYokk", async ({
    page,
  }) => {
    await page.goto("/");

    // Verifikasi Title tag
    await expect(page).toHaveTitle(/MagangYokk/i);

    // Verifikasi Brand Header
    const brandHeading = page.getByRole("heading", { name: "MagangYokk", level: 1 });
    await expect(brandHeading).toBeVisible();

    // Verifikasi Feedback Link di footer
    const feedbackLink = page.getByRole("link", {
      name: /Kritik & Saran \/ Lapor Bug/i,
    });
    await expect(feedbackLink).toBeVisible();
    await expect(feedbackLink).toHaveAttribute("target", "_blank");
  });

  test("2. Interaksi Pencarian Lowongan: filter posisi atau perusahaan", async ({
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
  });

  test("3. Pembukaan Drafter Cover Letter: membuka modal bottom-sheet", async ({
    page,
  }) => {
    await page.goto("/");

    const coverLetterBtn = page
      .getByRole("button", { name: /Cover Letter/i })
      .first();

    // Jika lowongan ada di database feed
    if (await coverLetterBtn.isVisible()) {
      await coverLetterBtn.click();

      // Heading modal harus tampil
      const modalHeading = page.getByRole("heading", {
        name: "Cover Letter Drafter",
      });
      await expect(modalHeading).toBeVisible();

      // Tombol switcher bahasa harus tampil
      await expect(
        page.getByRole("button", { name: "Bahasa Indonesia" })
      ).toBeVisible();
      await expect(
        page.getByRole("button", { name: "English" })
      ).toBeVisible();

      // Tutup modal
      const closeBtn = page.getByLabel("Tutup modal cover letter");
      await closeBtn.click();
      await expect(modalHeading).not.toBeVisible();
    } else {
      // Jika feed kosong saat pengujian, pastikan search container tetap tampil normal
      const searchInput = page.getByPlaceholder(
        "Filter posisi atau perusahaan..."
      );
      await expect(searchInput).toBeVisible();
    }
  });

  test("4. Siklus Hidup Pelacakan: mutasi status dari Feed dan verifikasi di Kanban Board", async ({
    page,
  }) => {
    await page.goto("/");

    const statusSelect = page
      .locator('select[aria-label="Pilih status lamaran"]')
      .first();

    if (await statusSelect.isVisible()) {
      // Mutasikan status lowongan pertama ke "saved" (Disimpan)
      await statusSelect.selectOption("saved");
      await expect(statusSelect).toHaveValue("saved");

      // Beralih ke tampilan Kanban Board
      const boardBtn = page.getByRole("button", { name: "Board" });
      await expect(boardBtn).toBeVisible();
      await boardBtn.click();

      // Verifikasi bahwa kolom "Disimpan" tampil dan aktif di Kanban
      const savedHeading = page.getByRole("heading", { name: "Disimpan" });
      await expect(savedHeading).toBeVisible();

      // Beralih kembali ke tampilan Feed
      const feedBtn = page.getByRole("button", { name: "Feed" });
      await expect(feedBtn).toBeVisible();
      await feedBtn.click();

      // Pastikan status select masih mempertahankan nilai "saved"
      await expect(statusSelect).toHaveValue("saved");
    } else {
      // Fallback jika feed kosong: uji tombol toggle Board tetap dapat diakses
      const boardBtn = page.getByRole("button", { name: "Board" });
      if (await boardBtn.isVisible()) {
        await boardBtn.click();
        const feedBtn = page.getByRole("button", { name: "Feed" });
        await expect(feedBtn).toBeVisible();
        await feedBtn.click();
      }
    }
  });
});
