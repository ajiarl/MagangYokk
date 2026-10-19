"use client"

import { useState, useEffect } from "react"
import { X, FileText, Check, Loader2 } from "lucide-react"
import { updateApplicationNotes } from "@/app/actions"
import { toast } from "sonner"
import { useAuth } from "@/components/auth-context"
interface NotesDrawerModalProps {
  jobId: string
  jobTitle: string
  company: string
  initialNotes: string | null
  isOpen: boolean
  onClose: () => void
  onSaveNotes: (notes: string) => void
}

export function NotesDrawerModal({
  jobId,
  jobTitle,
  company,
  initialNotes,
  isOpen,
  onClose,
  onSaveNotes
}: NotesDrawerModalProps) {
  const { user } = useAuth()
  const storageKey = `magangyokk_draft_notes_${user?.id || "guest"}_${jobId}`
  const [notes, setNotes] = useState(initialNotes || "")
  const [isSaving, setIsSaving] = useState(false)
  const [savedSuccess, setSavedSuccess] = useState(false)
  const [isDraftRecovered, setIsDraftRecovered] = useState(false)

  // SSR hydration-safe draft recovery on modal open
  useEffect(() => {
    if (!isOpen || !jobId) return

    try {
      if (typeof window !== "undefined") {
        const localDraft = localStorage.getItem(storageKey)
        if (localDraft !== null && localDraft !== (initialNotes || "")) {
          queueMicrotask(() => {
            setNotes(localDraft)
            setIsDraftRecovered(true)
          })
          return
        }
      }
    } catch (e) {
      console.warn("Gagal membaca draf catatan dari localStorage:", e)
    }

    queueMicrotask(() => {
      setNotes(initialNotes || "")
      setIsDraftRecovered(false)
    })
  }, [isOpen, jobId, initialNotes, storageKey])

  if (!isOpen) return null

  function handleNotesChange(value: string) {
    setNotes(value)
    try {
      if (typeof window !== "undefined" && jobId) {
        if (value.trim().length > 0) {
          localStorage.setItem(storageKey, value)
          setIsDraftRecovered(value !== (initialNotes || ""))
        } else {
          localStorage.removeItem(storageKey)
          setIsDraftRecovered(false)
        }
      }
    } catch (e) {
      console.warn("Gagal menyimpan draf catatan ke localStorage:", e)
    }
  }

  function handleDiscardDraft() {
    try {
      if (typeof window !== "undefined" && jobId) {
        localStorage.removeItem(storageKey)
      }
    } catch (e) {
      console.warn("Gagal menghapus draf catatan dari localStorage:", e)
    }
    setNotes(initialNotes || "")
    setIsDraftRecovered(false)
  }

  async function handleSave() {
    setIsSaving(true)
    const res = await updateApplicationNotes(jobId, notes)
    setIsSaving(false)

    if (res.success) {
      try {
        if (typeof window !== "undefined" && jobId) {
          localStorage.removeItem(storageKey)
        }
      } catch (e) {
        console.warn("Gagal membersihkan draf catatan dari localStorage:", e)
      }
      setIsDraftRecovered(false)
      setSavedSuccess(true)
      toast.success("Catatan lamaran berhasil disimpan")
      onSaveNotes(notes)
      setTimeout(() => {
        setSavedSuccess(false)
        onClose()
      }, 700)
    } else {
      toast.error("Gagal menyimpan catatan: " + (res.error || "Terjadi kesalahan"))
    }
  }
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md">
      <div
        className="w-full sm:max-w-lg max-h-[85dvh] sm:max-h-[85dvh] bg-[#0c0d0e] border-t sm:border border-white/[0.1] rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom sm:zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Drag Handle Indicator */}
        <div className="w-12 h-1.5 rounded-full bg-white/20 mx-auto mt-2.5 sm:hidden shrink-0" />

        {/* Header */}
        <div className="p-4 sm:px-6 border-b border-white/[0.06] flex items-start justify-between gap-3 shrink-0">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-mono text-[#5e6ad2]">
              <FileText className="w-3.5 h-3.5" />
              <span>Catatan Lamaran</span>
            </div>
            <h3 className="text-sm font-semibold text-white line-clamp-1">{jobTitle}</h3>
            <p className="text-xs text-[#8a8f98]">{company}</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Tutup modal catatan lamaran"
            className="h-9 w-9 sm:h-8 sm:w-8 inline-flex items-center justify-center rounded-lg text-[#8a8f98] hover:text-white hover:bg-white/[0.05] transition-colors touch-manipulation active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5e6ad2] focus-visible:ring-offset-2 focus-visible:ring-offset-[#08090a]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Notes Textarea Body */}
        <div className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 space-y-4">
          {isDraftRecovered && (
            <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs font-mono text-amber-300">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                <span>Draf lokal dipulihkan dari browser</span>
              </div>
              <button
                type="button"
                onClick={handleDiscardDraft}
                className="text-amber-400/80 hover:text-amber-300 hover:underline text-[11px] ml-2 touch-manipulation"
              >
                Hapus draf
              </button>
            </div>
          )}
          <div className="space-y-1.5">
            <label className="text-[11px] font-mono text-[#8a8f98]">
              Catatan pribadi (kontak HR, tanggal interview, gaji, status follow-up):
            </label>
            <textarea
              value={notes}
              onChange={(e) => handleNotesChange(e.target.value)}
              placeholder="Contoh: Udah kirim email ke HR Mas Dimas (hr@perusahaan.com). Interview tahap 1 dijadwalkan Rabu 14:00 WIB via Google Meet."
              rows={6}
              className="w-full bg-[#08090a] border border-white/[0.08] rounded-xl p-3 text-xs text-[#f7f8f8] placeholder-[#8a8f98] transition-colors resize-none leading-relaxed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5e6ad2] focus-visible:ring-offset-1 focus-visible:ring-offset-[#08090a]"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:px-6 border-t border-white/[0.06] bg-[#08090a] flex items-center justify-end gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="h-9 px-3.5 inline-flex items-center justify-center rounded-lg text-xs font-mono text-[#8a8f98] hover:text-white hover:bg-white/[0.05] transition-colors touch-manipulation active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5e6ad2] focus-visible:ring-offset-2 focus-visible:ring-offset-[#08090a]"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="h-9 px-4 inline-flex items-center gap-1.5 rounded-lg text-xs font-mono font-medium bg-[#5e6ad2] hover:bg-[#5e6ad2]/90 text-white transition-all shadow-sm active:scale-95 touch-manipulation disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5e6ad2] focus-visible:ring-offset-2 focus-visible:ring-offset-[#08090a]"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Menyimpan...</span>
              </>
            ) : savedSuccess ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Tersimpan!</span>
              </>
            ) : (
              <span>Simpan Catatan</span>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
