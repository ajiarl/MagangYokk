"use client"

import { useState, useTransition } from "react"
import { Job, ApplicationStatus } from "@/lib/types"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ExternalLink, MapPin, Sparkles, Building2, FileText, Check, Copy, Loader2, X, ChevronDown } from "lucide-react"
import { updateJobStatus } from "@/app/actions"

interface JobCardProps {
  job: Job
  initialStatus?: ApplicationStatus | null
  onStatusChange?: (status: ApplicationStatus) => void
}

const STATUS_LABELS: Record<ApplicationStatus, { label: string; color: string }> = {
  saved: { label: "Disimpan", color: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300" },
  applied: { label: "Dilamar", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300" },
  interview: { label: "Interview", color: "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300" },
  offered: { label: "Offered 🎉", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300" },
  rejected: { label: "Ditolak", color: "bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300" }
}

export function JobCard({ job, initialStatus, onStatusChange }: JobCardProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [draft, setDraft] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [lang, setLang] = useState<"id" | "en">("id")

  // State untuk Tracking Status
  const [currentStatus, setCurrentStatus] = useState<ApplicationStatus | null>(initialStatus || null)
  const [isPending, startTransition] = useTransition()

  const score = job.score ? Number(job.score).toFixed(1) : null

  async function handleStatusChange(newStatus: ApplicationStatus) {
    setCurrentStatus(newStatus)
    if (onStatusChange) {
      onStatusChange(newStatus)
    } else {
      startTransition(async () => {
        const res = await updateJobStatus(job.id, newStatus)
        if (!res.success) {
          alert("Gagal update status: " + res.error)
        }
      })
    }
  }

  async function handleGenerate(selectedLang: "id" | "en") {
    setLoading(true)
    setLang(selectedLang)
    try {
      const res = await fetch("/api/cover-letter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId: job.id, lang: selectedLang })
      })
      const data = await res.json()
      if (data.draft) {
        setDraft(data.draft)
        if (!currentStatus) setCurrentStatus("saved")
      } else {
        alert(data.error || "Gagal generate cover letter")
      }
    } catch (err: any) {
      alert("Error: " + err.message)
    } finally {
      setLoading(false)
    }
  }

  function handleCopy() {
    if (!draft) return
    navigator.clipboard.writeText(draft)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <>
      <Card className="hover:border-zinc-400 dark:hover:border-zinc-700 transition-all flex flex-col justify-between">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h4 className="font-semibold text-base text-zinc-900 dark:text-zinc-100 line-clamp-1">
                {job.title}
              </h4>
              <div className="flex items-center gap-1.5 text-xs text-zinc-500 mt-1">
                <Building2 className="w-3.5 h-3.5" />
                <span>{job.company}</span>
              </div>
            </div>
            {score && (
              <div className="flex items-center gap-1 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 px-2 py-0.5 rounded-full text-xs font-bold">
                <Sparkles className="w-3 h-3" />
                <span>{score}</span>
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-3 pb-3 text-xs">
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge variant={job.is_remote ? "remote" : "secondary"}>
              <MapPin className="w-3 h-3 mr-1 inline" />
              {job.is_remote ? "Remote" : job.location || "On-site"}
            </Badge>

            {job.is_paid !== null && (
              <Badge variant={job.is_paid ? "paid" : "outline"}>
                {job.is_paid ? "Paid / Ada Gaji" : "Unpaid"}
              </Badge>
            )}

            <Badge variant="outline" className="uppercase tracking-wider font-mono text-[10px]">
              {job.source}
            </Badge>
          </div>

          {job.description && (
            <p className="text-zinc-600 dark:text-zinc-400 line-clamp-2 leading-relaxed text-xs">
              {job.description}
            </p>
          )}

          {job.score_breakdown && (
            <div className="flex flex-wrap gap-1 pt-1">
              {Object.entries(job.score_breakdown).map(([skill, matched]) =>
                matched ? (
                  <span
                    key={skill}
                    className="bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-[10px] px-1.5 py-0.5 rounded font-mono"
                  >
                    {skill.replace("_", " ")}
                  </span>
                ) : null
              )}
            </div>
          )}
        </CardContent>

        <CardFooter className="pt-3 border-t border-zinc-100 dark:border-zinc-800/60 flex flex-col gap-2">
          {/* Row 1: Status Tracking Bar */}
          <div className="w-full flex items-center justify-between text-xs">
            <span className="text-zinc-400 text-[11px] flex items-center gap-1">
              Status:
              {isPending && <Loader2 className="w-3 h-3 animate-spin inline text-emerald-600" />}
            </span>
            <div className="relative">
              <select
                value={currentStatus || ""}
                onChange={(e) => {
                  const val = e.target.value as ApplicationStatus
                  if (val) handleStatusChange(val)
                }}
                disabled={isPending}
                className={`text-xs px-2.5 py-1 rounded-md border border-zinc-200 dark:border-zinc-800 font-medium cursor-pointer focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                  currentStatus ? STATUS_LABELS[currentStatus].color : "bg-zinc-50 text-zinc-500 dark:bg-zinc-900"
                }`}
              >
                <option value="" disabled>Pilih Status...</option>
                <option value="saved">Disimpan</option>
                <option value="applied">Dilamar</option>
                <option value="interview">Interview</option>
                <option value="offered">Offered 🎉</option>
                <option value="rejected">Ditolak</option>
              </select>
            </div>
          </div>

          {/* Row 2: Links & Actions */}
          <div className="w-full flex items-center justify-between gap-2 pt-1">
            <a
              href={job.url}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 flex items-center gap-1"
            >
              Lihat Asli <ExternalLink className="w-3 h-3" />
            </a>

            <Button
              size="sm"
              variant="default"
              className="text-xs h-8 gap-1.5"
              onClick={() => {
                setIsOpen(true)
                if (!draft) handleGenerate("id")
              }}
            >
              <FileText className="w-3.5 h-3.5" />
              Cover Letter
            </Button>
          </div>
        </CardFooter>
      </Card>

      {/* Modal / Dialog Pop-up Cover Letter */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in-0 zoom-in-95">
            {/* Modal Header */}
            <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-sm">Cover Letter Generator</h3>
                <p className="text-xs text-zinc-500">{job.title} — {job.company}</p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Language Selector */}
            <div className="px-4 py-2 bg-zinc-50 dark:bg-zinc-950 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-xs">
              <span className="text-zinc-500">Bahasa Output:</span>
              <div className="flex items-center gap-1.5">
                <Button
                  size="sm"
                  variant={lang === "id" ? "default" : "outline"}
                  className="h-7 text-xs px-2.5"
                  disabled={loading}
                  onClick={() => handleGenerate("id")}
                >
                  Bahasa Indonesia
                </Button>
                <Button
                  size="sm"
                  variant={lang === "en" ? "default" : "outline"}
                  className="h-7 text-xs px-2.5"
                  disabled={loading}
                  onClick={() => handleGenerate("en")}
                >
                  English
                </Button>
              </div>
            </div>

            {/* Modal Content / Draft Area */}
            <div className="p-4 flex-1 overflow-y-auto">
              {loading ? (
                <div className="py-16 text-center space-y-2">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-emerald-600" />
                  <p className="text-xs text-zinc-500">Menyusun surat lamaran personal berbasis fakta profil...</p>
                </div>
              ) : draft ? (
                <div className="bg-zinc-50 dark:bg-zinc-950 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs font-mono leading-relaxed whitespace-pre-wrap text-zinc-800 dark:text-zinc-200">
                  {draft}
                </div>
              ) : (
                <div className="py-12 text-center text-xs text-zinc-500">
                  Klik bahasa di atas untuk men-generate cover letter.
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
              <span className="text-[11px] text-zinc-400">
                Tersimpan otomatis ke database applications kamu
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs gap-1.5"
                  disabled={!draft || loading}
                  onClick={handleCopy}
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? "Tersalin!" : "Salin Teks"}
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  className="h-8 text-xs"
                  onClick={() => setIsOpen(false)}
                >
                  Selesai
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
