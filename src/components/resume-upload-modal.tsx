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
  const [uploading, setUploading] = useState(false)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!isOpen) return null

  async function handleUpload() {
    if (!file) return
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
    } catch (err: any) {
      setErrorMsg(err.message)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in-0 duration-150">
      <div
        className="w-full max-w-md rounded-2xl bg-[#0c0d0e] border border-white/[0.08] shadow-2xl p-6 space-y-4 text-left"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-white/[0.06] pb-3">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-mono text-[#5e6ad2]">
              <Upload className="w-3.5 h-3.5" />
              <span>Upload Resume PDF</span>
            </div>
            <h3 className="text-sm font-semibold text-white">Sinkronisasi CV ke AI</h3>
          </div>
          <button
            onClick={onClose}
            className="text-[#8a8f98] hover:text-white p-1 rounded-lg hover:bg-white/[0.05] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Dropzone area */}
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

        {/* Footer actions */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/[0.06]">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg text-xs font-mono text-[#8a8f98] hover:text-white hover:bg-white/[0.05] transition-colors"
          >
            Batal
          </button>
          <button
            type="button"
            disabled={!file || uploading}
            onClick={handleUpload}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-mono font-medium bg-[#5e6ad2] hover:bg-[#5e6ad2]/90 text-white transition-all shadow-sm active:scale-95 disabled:opacity-40"
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
