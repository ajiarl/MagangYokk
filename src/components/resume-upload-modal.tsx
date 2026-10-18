"use client"

import { useState, useRef } from "react"
import { Upload, FileText, CheckCircle2, AlertCircle, Loader2, X } from "lucide-react"

export function ResumeUploadModal({
  isOpen,
  onClose
}: {
  isOpen: boolean
  onClose: () => void
}) {
  const [file, setFile] = useState<File | null>(null)
  const [consentGiven, setConsentGiven] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!isOpen) return null

  async function handleUpload() {
    if (!file || !consentGiven) return
    setUploading(true)
    setErrorMsg(null)
    setSuccessMsg(null)

    try {
      const formData = new FormData()
      formData.append("file", file)

      const res = await fetch("/api/resume/upload", {
        method: "POST",
        body: formData
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "Gagal mengunggah resume.")
      }

      setSuccessMsg(`Resume berhasil diekstrak (${data.textLength} karakter) dan disimpan ke profil kamu.`)
      setTimeout(() => {
        onClose()
      }, 1500)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      setErrorMsg(message)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md">
      <div
        className="w-full sm:max-w-md max-h-[90vh] sm:max-h-[85vh] bg-[#0c0d0e] border-t sm:border border-white/[0.1] rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom sm:zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Drag Handle Indicator */}
        <div className="w-12 h-1.5 rounded-full bg-white/20 mx-auto mt-2.5 sm:hidden shrink-0" />

        {/* Header */}
        <div className="p-4 sm:px-6 border-b border-white/[0.06] flex items-start justify-between gap-3 shrink-0">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-mono text-[#5e6ad2]">
              <Upload className="w-3.5 h-3.5" />
              <span>Upload Resume PDF</span>
            </div>
            <h3 className="text-sm font-semibold text-white">Sinkronisasi CV ke AI</h3>
          </div>
          <button
            onClick={onClose}
            className="h-9 w-9 sm:h-8 sm:w-8 inline-flex items-center justify-center rounded-lg text-[#8a8f98] hover:text-white hover:bg-white/[0.05] transition-colors touch-manipulation active:scale-95"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Dropzone area Body */}
        <div className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 space-y-4">
          <div
            onClick={() => fileInputRef.current?.click()}
            className="cursor-pointer border-2 border-dashed border-white/[0.08] hover:border-[#5e6ad2]/50 rounded-2xl p-6 text-center space-y-2 bg-[#08090a] transition-all"
          >
            <input
              type="file"
              ref={fileInputRef}
              accept=".pdf"
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.[0]) {
                  setFile(e.target.files[0])
                  setErrorMsg(null)
                }
              }}
            />
            <div className="w-10 h-10 rounded-full bg-white/[0.04] flex items-center justify-center mx-auto text-[#8a8f98]">
              <FileText className="w-5 h-5" />
            </div>
            {file ? (
              <div>
                <p className="text-xs font-medium text-white">{file.name}</p>
                <p className="text-[10px] font-mono text-[#8a8f98]">
                  {(file.size / 1024).toFixed(1)} KB
                </p>
              </div>
            ) : (
              <div>
                <p className="text-xs font-medium text-[#d0d6e0]">
                  Klik untuk memilih file PDF CV kamu
                </p>
                <p className="text-[10px] font-mono text-[#8a8f98]">Format .pdf (Maks 10 MB)</p>
              </div>
            )}
          </div>

          <label className="flex items-start gap-2.5 cursor-pointer text-xs text-[#8a8f98] select-none p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.12] transition-colors">
            <input
              type="checkbox"
              checked={consentGiven}
              onChange={(e) => setConsentGiven(e.target.checked)}
              className="mt-0.5 rounded border-white/20 bg-white/5 text-[#5e6ad2] focus:ring-[#5e6ad2] focus:ring-offset-0"
            />
            <span>
              Saya menyetujui pemrosesan data CV saya untuk analisis kesenjangan skill dan pembuatan surat lamaran via Groq Cloud (AS) sesuai{" "}
              <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-[#5e6ad2] underline hover:text-[#7170ff]">
                Kebijakan Privasi (UU PDP)
              </a>.
            </span>
          </label>
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="p-4 sm:px-6 border-t border-white/[0.06] bg-[#08090a] flex items-center justify-end gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="h-9 px-3.5 inline-flex items-center justify-center rounded-lg text-xs font-mono text-[#8a8f98] hover:text-white hover:bg-white/[0.05] transition-colors touch-manipulation active:scale-95"
          >
            Batal
          </button>
          <button
            type="button"
            disabled={!file || !consentGiven || uploading}
            onClick={handleUpload}
            className="h-9 px-4 inline-flex items-center gap-1.5 rounded-lg text-xs font-mono font-medium bg-[#5e6ad2] hover:bg-[#5e6ad2]/90 text-white transition-all shadow-sm active:scale-95 touch-manipulation disabled:opacity-40"
          >
            {uploading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Mengekstrak PDF...</span>
              </>
            ) : (
              <span>Simpan ke Profil</span>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
