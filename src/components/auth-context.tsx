"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { getUserSessionAndApplications } from "@/app/actions"
import { ApplicationStatus } from "@/lib/types"
import { AuthModal } from "@/components/auth-modal"
import { toast } from "sonner"

export interface UserSessionData {
  id: string
  email?: string
  fullName?: string
}

export interface UserApplicationData {
  status: ApplicationStatus
  notes: string | null
}

export interface AuthContextValue {
  user: UserSessionData | null
  applications: Record<string, UserApplicationData>
  isLoading: boolean
  openAuthModal: (contextMessage?: string | null) => void
  closeAuthModal: () => void
  signOut: () => Promise<void>
  refreshSession: () => Promise<void>
  setLocalApplication: (jobId: string, status: ApplicationStatus, notes?: string | null) => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserSessionData | null>(null)
  const [applications, setApplications] = useState<Record<string, UserApplicationData>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalContextMessage, setModalContextMessage] = useState<string | null>(null)

  const refreshSession = useCallback(async () => {
    try {
      const data = await getUserSessionAndApplications()
      setUser(data.user)
      setApplications(data.applications)
    } catch (err) {
      console.error("Gagal refresh session:", err)
      setUser(null)
      setApplications({})
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    let isMounted = true

    async function initialize() {
      try {
        const data = await getUserSessionAndApplications()
        if (isMounted) {
          setUser(data.user)
          setApplications(data.applications)
          setIsLoading(false)
        }
      } catch (err) {
        if (isMounted) {
          console.error("Gagal initialize session:", err)
          setUser(null)
          setApplications({})
          setIsLoading(false)
        }
      }
    }

    void initialize()

    // Listen to Supabase client auth state changes
    try {
      const supabase = createClient()
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange(async (event) => {
        if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED" || event === "USER_UPDATED") {
          await refreshSession()
        } else if (event === "SIGNED_OUT") {
          setUser(null)
          setApplications({})
        }
      })

      return () => {
        isMounted = false
        subscription.unsubscribe()
      }
    } catch {
      return () => {
        isMounted = false
      }
    }
  }, [refreshSession])

  const openAuthModal = useCallback((contextMessage?: string | null) => {
    setModalContextMessage(contextMessage || null)
    setIsModalOpen(true)
  }, [])

  const closeAuthModal = useCallback(() => {
    setIsModalOpen(false)
    setModalContextMessage(null)
  }, [])

  const signOut = useCallback(async () => {
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
      setUser(null)
      setApplications({})
      toast.success("Berhasil keluar.")
    } catch (err) {
      console.error("Error signing out:", err)
      toast.error("Gagal keluar dari sesi.")
    }
  }, [])

  const setLocalApplication = useCallback(
    (jobId: string, status: ApplicationStatus, notes?: string | null) => {
      setApplications((prev) => ({
        ...prev,
        [jobId]: {
          status,
          notes: notes !== undefined ? notes : prev[jobId]?.notes ?? null,
        },
      }))
    },
    []
  )

  const contextValue: AuthContextValue = {
    user,
    applications,
    isLoading,
    openAuthModal,
    closeAuthModal,
    signOut,
    refreshSession,
    setLocalApplication,
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
      <AuthModal
        isOpen={isModalOpen}
        onClose={closeAuthModal}
        contextMessage={modalContextMessage}
        onSuccess={refreshSession}
      />
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth harus digunakan di dalam <AuthProvider>")
  }
  return context
}
