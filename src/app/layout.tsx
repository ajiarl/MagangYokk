import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/react";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#08090a",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://magangyokk.com"),
  title: {
    default: "MagangYokk - Agregator Lowongan Magang & Tracking Karir Mahasiswa IT",
    template: "%s | MagangYokk",
  },
  description:
    "Agregator lowongan magang tech stack modern (Next.js, React, Laravel, Supabase) dengan AI Cover Letter otomatis dan Kanban tracking pelamar mahasiswa IT Indonesia.",
  keywords: [
    "magang IT",
    "internship web developer",
    "magang mahasiswa",
    "lowongan IT Indonesia",
    "magang frontend",
    "magang backend",
    "magang nextjs",
    "magang laravel",
  ],
  authors: [{ name: "MagangYokk Team" }],
  creator: "MagangYokk",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "MagangYokk - Temukan Magang IT Sesuai Tech Stack Kamu",
    description:
      "Filter cerdas, scoring otomatis berdasarkan tech stack, dan buat cover letter instan via AI untuk mahasiswa IT Indonesia.",
    url: "https://magangyokk.com",
    siteName: "MagangYokk",
    locale: "id_ID",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "MagangYokk - Agregator Lowongan Magang IT Indonesia",
    description:
      "Platform agregator lowongan magang IT Indonesia dengan AI Cover Letter generator dan Kanban tracking.",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="id"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
