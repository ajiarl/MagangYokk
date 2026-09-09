"use client"

import { useState } from "react"
import { X, FileText, Check, Loader2 } from "lucide-react"
import { updateApplicationNotes } from "@/app/actions"

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
  const [notes, setNotes] = useState(initialNotes || "")
  const [isSaving, setIsSaving] = useState(false)
  const [savedSuccess, setSavedSuccess] = useState(false)

  if (!isOpen) return null

  async function handleSave() {
    setIsSaving(true)
    const res = await updateApplicationNotes(jobId, notes)
    setIsSaving(false)

    if (res.success) {
      setSavedSuccess(true)
      onSaveNotes(notes)
      setTimeout(() => {
        setSavedSuccess(false)
        onClose()
      }, 700)
    } else {
      alert("Gagal menyimpan catatan: " + res.error)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="w-full max-w-lg rounded-2xl bg-[#0c0d0e] border border-white/[0.08] shadow-2xl p-5 space-y-4 text-left"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-white/[0.06] pb-3">
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
            className="text-[#8a8f98] hover:text-white p-1 rounded-lg hover:bg-white/[0.05] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Notes Textarea */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-mono text-[#8a8f98]">
            Catatan pribadi (kontak HR, tanggal interview, gaji, status follow-up):
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Contoh: Udah kirim email ke HR Mas Dimas (hr@perusahaan.com). Interview tahap 1 dijadwalkan Rabu 14:00 WIB via Google Meet."
            rows={5}
            className="w-full bg-[#08090a] border border-white/[0.08] focus:border-[#5e6ad2] rounded-xl p-3 text-xs text-[#f7f8f8] placeholder-[#62666d] outline-none transition-colors resize-none leading-relaxed"
          />
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg text-xs font-mono text-[#8a8f98] hover:text-white hover:bg-white/[0.05] transition-colors"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-mono font-medium bg-[#5e6ad2] hover:bg-[#5e6ad2]/90 text-white transition-all shadow-sm active:scale-95 disabled:opacity-50"
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
