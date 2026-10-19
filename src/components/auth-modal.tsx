"use client"

import { useState } from "react"
import { X, Mail, ArrowRight, ShieldCheck, Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

export interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  contextMessage?: string | null
  onSuccess?: () => void
}

export function AuthModal({
  isOpen,
  onClose,
  contextMessage,
  onSuccess,
}: AuthModalProps) {
  const [email, setEmail] = useState("")
  const [token, setToken] = useState("")
  const [step, setStep] = useState<"email" | "otp">("email")
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createClient()

  if (!isOpen) return null

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault()
    const trimmedEmail = email.trim()
    if (!trimmedEmail || !trimmedEmail.includes("@")) {
      toast.error("Masukkan alamat email yang valid.")
      return
    }

    try {
      setIsLoading(true)
      const { error } = await supabase.auth.signInWithOtp({
        email: trimmedEmail,
        options: {
          shouldCreateUser: true,
        },
      })

      if (error) {
        toast.error(`Gagal mengirim kode: ${error.message}`)
        return
      }

      toast.success("Kode verifikasi OTP telah dikirim ke email Anda.")
      setStep("otp")
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan."
      toast.error(msg)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault()
    const trimmedToken = token.trim()
    if (!trimmedToken) {
      toast.error("Masukkan 6 digit kode OTP verifikasi.")
      return
    }

    try {
      setIsLoading(true)
      const { error } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: trimmedToken,
        type: "email",
      })

      if (error) {
        toast.error(`Kode verifikasi salah: ${error.message}`)
        return
      }

      toast.success("Berhasil masuk ke MagangYokk!")
      onClose()
      onSuccess?.()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan verifikasi."
      toast.error(msg)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleGoogleLogin() {
    try {
      setIsLoading(true)
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: typeof window !== "undefined" ? window.location.origin : undefined,
        },
      })
      if (error) {
        toast.error(`Gagal masuk via Google: ${error.message}`)
        setIsLoading(false)
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal membuka sesi Google."
      toast.error(msg)
      setIsLoading(false)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
      aria-describedby="auth-modal-description"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="relative w-full max-w-md rounded-2xl bg-[#0c0d0e] border border-white/[0.1] shadow-2xl p-6 sm:p-7 text-[#f7f8f8] space-y-5">
        {/* Header Modal */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2
              id="auth-modal-title"
              className="text-lg font-semibold tracking-tight text-white flex items-center gap-2"
            >
              Masuk ke MagangYokk
            </h2>
            <p id="auth-modal-description" className="text-xs text-[#8a8f98] mt-1">
              Simpan lowongan, lacak status lamaran, dan buat cover letter AI.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup dialog"
            className="rounded-lg p-1 text-[#8a8f98] hover:text-white hover:bg-white/[0.06] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Barrier Context Message */}
        {contextMessage && (
          <div className="rounded-lg bg-indigo-500/10 border border-indigo-500/20 px-3.5 py-2.5 text-xs text-indigo-300 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 shrink-0 text-indigo-400" />
            <span>{contextMessage}</span>
          </div>
        )}

        {/* Google OAuth Button */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2.5 h-10 px-4 rounded-xl bg-white text-[#0c0d0e] hover:bg-neutral-200 font-medium text-xs transition-colors shadow-sm disabled:opacity-50"
        >
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>Lanjutkan dengan Google</span>
        </button>

        {/* Divider */}
        <div className="relative flex items-center justify-center">
          <div className="w-full border-t border-white/[0.08]" />
          <span className="relative bg-[#0c0d0e] px-2 text-[10px] uppercase font-mono tracking-wider text-[#62666d]">
            atau dengan email
          </span>
        </div>

        {/* OTP Email Form */}
        {step === "email" ? (
          <form onSubmit={handleSendOtp} className="space-y-3">
            <div className="space-y-1">
              <label htmlFor="auth-email-input" className="text-xs font-mono text-[#8a8f98]">
                Alamat Email Mahasiswa / Pribadi
              </label>
              <div className="relative">
                <input
                  id="auth-email-input"
                  type="email"
                  required
                  placeholder="nama@kampus.ac.id"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  className="w-full h-10 px-3.5 pl-9 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs text-white placeholder:text-[#62666d] focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                />
                <Mail className="w-4 h-4 text-[#62666d] absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-10 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>Kirim Kode OTP</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-3">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label htmlFor="auth-token-input" className="text-xs font-mono text-[#8a8f98]">
                  Kode 6 Digit OTP
                </label>
                <button
                  type="button"
                  onClick={() => setStep("email")}
                  className="text-[11px] text-indigo-400 hover:underline font-mono"
                >
                  Ganti email
                </button>
              </div>
              <input
                id="auth-token-input"
                type="text"
                required
                maxLength={8}
                inputMode="numeric"
                autoFocus
                placeholder="123456"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                disabled={isLoading}
                className="w-full h-10 px-3.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-center tracking-widest font-mono text-sm text-white placeholder:text-[#62666d] focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
              />
              <p className="text-[11px] text-[#62666d]">
                Dikirimkan ke <span className="text-[#8a8f98]">{email}</span>. Periksa folder spam jika tidak muncul.
              </p>
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-10 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <span>Verifikasi Kode & Masuk</span>
              )}
            </button>
          </form>
        )}

        {/* UU PDP Footer Notice */}
        <p className="text-[10px] text-center text-[#62666d] font-mono">
          Data akun dan privasi Anda terenkripsi dan dilindungi sesuai UU PDP No. 27/2022.
        </p>
      </div>
    </div>
  )
}
