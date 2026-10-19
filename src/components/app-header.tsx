"use client"

import { useAuth } from "@/components/auth-context"
import { formatRelativeTime } from "@/lib/job-utils"
import { LogIn, LogOut } from "lucide-react"

export interface AppHeaderProps {
  totalJobs: number
  latestScrapedAt?: string | null
}

export function AppHeader({ totalJobs, latestScrapedAt }: AppHeaderProps) {
  const { user, openAuthModal, signOut } = useAuth()

  const displayName = user?.fullName || user?.email?.split("@")[0] || "User"
  const initial = displayName.charAt(0).toUpperCase()

  return (
    <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#08090a]/90 backdrop-blur-md">
      <div className="w-full px-6 h-12 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="font-semibold text-[13px] tracking-tight text-[#f7f8f8]">MagangYokk</h1>
          <span className="text-[11px] font-mono text-[#8a8f98]">/</span>
          <span className="text-xs text-[#8a8f98] font-mono">{totalJobs} opportunities</span>
          {latestScrapedAt && (
            <>
              <span className="hidden sm:inline text-[11px] font-mono text-[#8a8f98]">/</span>
              <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-mono text-[#8a8f98]">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span suppressHydrationWarning>Sinkronisasi: {formatRelativeTime(latestScrapedAt)}</span>
              </div>
            </>
          )}
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-[10px] font-mono text-indigo-300">
                  {initial}
                </div>
                <span className="hidden sm:inline text-xs text-[#8a8f98] font-mono max-w-[150px] truncate">
                  {displayName}
                </span>
              </div>
              <button
                type="button"
                onClick={() => signOut()}
                aria-label="Keluar dari akun"
                className="h-7 px-2.5 rounded-lg border border-white/[0.08] hover:border-white/[0.16] bg-white/[0.03] hover:bg-white/[0.06] text-[11px] font-mono text-[#8a8f98] hover:text-white transition-colors flex items-center gap-1.5"
              >
                <LogOut className="w-3 h-3" />
                <span>Keluar</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => openAuthModal()}
              className="h-8 px-3 rounded-lg border border-white/[0.1] hover:border-white/[0.2] bg-white/[0.04] hover:bg-white/[0.08] text-xs font-medium text-white transition-colors flex items-center gap-1.5"
            >
              <LogIn className="w-3.5 h-3.5 text-[#8a8f98]" />
              <span>Masuk</span>
            </button>
          )}
        </div>
      </div>
    </header>
  )
}
