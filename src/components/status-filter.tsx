"use client"

import { ApplicationStatus } from "@/lib/types"

interface StatusFilterProps {
  currentFilter: string
  counts: Record<string, number>
  onFilterChange: (status: string) => void
}

const TABS: { id: string; label: string }[] = [
  { id: "all", label: "Semua" },
  { id: "saved", label: "Disimpan" },
  { id: "applied", label: "Dilamar" },
  { id: "interview", label: "Interview" },
  { id: "offered", label: "Offered" },
  { id: "rejected", label: "Ditolak" }
]

export function StatusFilter({ currentFilter, counts, onFilterChange }: StatusFilterProps) {
  return (
    <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none font-mono text-xs">
      {TABS.map((tab) => {
        const count = counts[tab.id] || 0
        const isActive = currentFilter === tab.id

        return (
          <button
            key={tab.id}
            onClick={() => onFilterChange(tab.id)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded transition-all whitespace-nowrap border ${
              isActive
                ? "bg-white/[0.08] text-white border-white/[0.16] font-medium"
                : "bg-transparent text-[#8a8f98] hover:text-[#d0d6e0] hover:bg-white/[0.03] border-transparent"
            }`}
          >
            <span>{tab.label}</span>
            <span
              className={`text-[10px] px-1 py-0.2 rounded ${
                isActive
                  ? "bg-white/[0.12] text-white"
                  : "bg-white/[0.04] text-[#62666d]"
              }`}
            >
              {count}
            </span>
          </button>
        )
      })}
    </div>
  )
}
