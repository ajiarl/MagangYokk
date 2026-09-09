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
  { id: "offered", label: "Offered 🎉" },
  { id: "rejected", label: "Ditolak" }
]

export function StatusFilter({ currentFilter, counts, onFilterChange }: StatusFilterProps) {
  return (
    <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
      {TABS.map((tab) => {
        const count = counts[tab.id] || 0
        const isActive = currentFilter === tab.id

        return (
          <button
            key={tab.id}
            onClick={() => onFilterChange(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
              isActive
                ? "bg-zinc-900 text-zinc-50 dark:bg-zinc-100 dark:text-zinc-900 shadow-sm"
                : "bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-800"
            }`}
          >
            <span>{tab.label}</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                isActive
                  ? "bg-zinc-700 text-zinc-100 dark:bg-zinc-300 dark:text-zinc-900"
                  : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500"
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
