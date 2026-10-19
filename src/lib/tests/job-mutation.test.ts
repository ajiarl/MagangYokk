import { describe, it, expect, vi, beforeEach } from "vitest"
import { updateJobStatus } from "@/app/actions"
import { ApplicationStatus } from "@/lib/types"

vi.mock("server-only", () => ({}))

const {
  mockHeadersGet,
  mockRevalidatePath,
  mockRecordAuditLog,
  mockProfilesMaybeSingle,
  mockApplicationsUpsert,
  mockFrom,
} = vi.hoisted(() => {
  const headersGet = vi.fn()
  const revalidatePath = vi.fn()
  const recordAuditLog = vi.fn().mockResolvedValue(undefined)

  const maybeSingle = vi.fn()
  const limit = vi.fn(() => ({ maybeSingle }))
  const order = vi.fn(() => ({ limit }))
  const select = vi.fn(() => ({ order }))
  const upsert = vi.fn()

  const from = vi.fn((table: string) => {
    if (table === "profiles") {
      return { select }
    }
    if (table === "applications") {
      return { upsert }
    }
    return {}
  })

  return {
    mockHeadersGet: headersGet,
    mockRevalidatePath: revalidatePath,
    mockRecordAuditLog: recordAuditLog,
    mockProfilesMaybeSingle: maybeSingle,
    mockApplicationsUpsert: upsert,
    mockFrom: from,
  }
})

vi.mock("next/headers", () => ({
  headers: vi.fn(async () => ({
    get: mockHeadersGet,
  })),
}))

vi.mock("next/cache", () => ({
  revalidatePath: mockRevalidatePath,
}))

vi.mock("@/lib/audit-trail", () => ({
  recordAuditLog: mockRecordAuditLog,
}))

vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: mockFrom,
  },
}))

describe("Server Action: updateJobStatus Integration Tests", () => {
  const originalEnv = process.env

  beforeEach(() => {
    vi.clearAllMocks()
    process.env = { ...originalEnv }
    delete process.env.INTERNAL_ACTION_SECRET

    // Default authorized headers (origin matches host)
    mockHeadersGet.mockImplementation((key: string) => {
      switch (key.toLowerCase()) {
        case "host":
          return "localhost:3000"
        case "origin":
          return "http://localhost:3000"
        case "x-forwarded-for":
          return "203.0.113.195, 10.0.0.1"
        default:
          return null
      }
    })

    // Default authenticated profile
    mockProfilesMaybeSingle.mockResolvedValue({
      data: { id: "profile-aji-uuid-123" },
      error: null,
    })

    // Default successful upsert
    mockApplicationsUpsert.mockResolvedValue({
      error: null,
    })
  })

  it("Case 1 (Happy Path - Transition to Saved): berhasil menyimpan status lamaran 'saved', mencatat audit log, dan merevalidasi cache", async () => {
    const result = await updateJobStatus("job-uuid-101", "saved")

    expect(result).toEqual({ success: true })
    expect(mockFrom).toHaveBeenCalledWith("profiles")
    expect(mockFrom).toHaveBeenCalledWith("applications")
    expect(mockApplicationsUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        job_id: "job-uuid-101",
        profile_id: "profile-aji-uuid-123",
        status: "saved",
        updated_at: expect.any(String),
      }),
      { onConflict: "job_id,profile_id" }
    )

    // Pastikan applied_at tidak diset untuk status "saved"
    const upsertPayload = mockApplicationsUpsert.mock.calls[0][0]
    expect(upsertPayload.applied_at).toBeUndefined()

    // Verifikasi audit trail
    expect(mockRecordAuditLog).toHaveBeenCalledWith({
      actionType: "STATUS_CHANGE",
      entityId: "job-uuid-101",
      payloadSummary: { status: "saved" },
      rawIp: "203.0.113.195",
    })

    // Verifikasi pemanggilan revalidatePath
    expect(mockRevalidatePath).toHaveBeenCalledWith("/")
  })

  it("Case 2 (Happy Path - Transition to Applied with Timestamp): menetapkan applied_at dengan timestamp ISO yang valid", async () => {
    const result = await updateJobStatus("job-uuid-202", "applied")

    expect(result).toEqual({ success: true })
    expect(mockApplicationsUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        job_id: "job-uuid-202",
        profile_id: "profile-aji-uuid-123",
        status: "applied",
        applied_at: expect.any(String),
        updated_at: expect.any(String),
      }),
      { onConflict: "job_id,profile_id" }
    )

    const payload = mockApplicationsUpsert.mock.calls[0][0]
    expect(new Date(payload.applied_at).toString()).not.toBe("Invalid Date")
    expect(mockRecordAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        actionType: "STATUS_CHANGE",
        entityId: "job-uuid-202",
        payloadSummary: { status: "applied" },
      })
    )
  })

  it("Case 3 (Happy Path - Transition to Interview, Offered, and Rejected): seluruh enum valid diproses tanpa hambatan", async () => {
    const additionalStatuses: ApplicationStatus[] = ["interview", "offered", "rejected"]

    for (const status of additionalStatuses) {
      vi.clearAllMocks()
      mockProfilesMaybeSingle.mockResolvedValue({
        data: { id: "profile-aji-uuid-123" },
        error: null,
      })
      mockApplicationsUpsert.mockResolvedValue({ error: null })

      const result = await updateJobStatus(`job-uuid-${status}`, status)
      expect(result).toEqual({ success: true })
      expect(mockApplicationsUpsert).toHaveBeenCalledWith(
        expect.objectContaining({
          job_id: `job-uuid-${status}`,
          status,
        }),
        { onConflict: "job_id,profile_id" }
      )
    }
  })

  it("Case 4 (Negative - Unauthorized Request): permintaan ditolak jika origin tidak cocok dengan host", async () => {
    mockHeadersGet.mockImplementation((key: string) => {
      switch (key.toLowerCase()) {
        case "host":
          return "localhost:3000"
        case "origin":
          return "https://malicious-attacker.com"
        default:
          return null
      }
    })

    const result = await updateJobStatus("job-uuid-1", "saved")

    expect(result).toEqual({
      success: false,
      error: "Akses ditolak atau input tidak valid.",
    })
    expect(mockFrom).not.toHaveBeenCalled()
    expect(mockApplicationsUpsert).not.toHaveBeenCalled()
    expect(mockRecordAuditLog).not.toHaveBeenCalled()
  })

  it("Case 4b (Authorization via Internal Secret): request dengan origin berbeda diizinkan jika header x-action-secret valid", async () => {
    process.env.INTERNAL_ACTION_SECRET = "super-secret-token-123"
    mockHeadersGet.mockImplementation((key: string) => {
      switch (key.toLowerCase()) {
        case "x-action-secret":
          return "super-secret-token-123"
        case "host":
          return "localhost:3000"
        case "origin":
          return "https://external-service.local"
        default:
          return null
      }
    })

    const result = await updateJobStatus("job-uuid-internal", "saved")
    expect(result).toEqual({ success: true })
    expect(mockApplicationsUpsert).toHaveBeenCalled()
  })

  it("Case 5 (Negative - Invalid Status Outside Enum): menolak status yang tidak terdaftar dalam ALLOWED_STATUSES", async () => {
    // @ts-expect-error Pengujian input runtime ilegal
    const result = await updateJobStatus("job-uuid-1", "hired")

    expect(result).toEqual({
      success: false,
      error: "Akses ditolak atau input tidak valid.",
    })
    expect(mockApplicationsUpsert).not.toHaveBeenCalled()
  })

  it("Case 6 (Negative - Invalid Job ID): menolak jobId kosong, spasi saja, atau melebihi 128 karakter", async () => {
    const emptyResult = await updateJobStatus("", "saved")
    expect(emptyResult).toEqual({
      success: false,
      error: "Akses ditolak atau input tidak valid.",
    })

    const whitespaceResult = await updateJobStatus("   ", "saved")
    expect(whitespaceResult).toEqual({
      success: false,
      error: "Akses ditolak atau input tidak valid.",
    })

    const tooLongJobId = "a".repeat(129)
    const longResult = await updateJobStatus(tooLongJobId, "saved")
    expect(longResult).toEqual({
      success: false,
      error: "Akses ditolak atau input tidak valid.",
    })

    expect(mockApplicationsUpsert).not.toHaveBeenCalled()
  })

  it("Case 7 (Negative - Missing Profile): mengembalikan error ramah jika profil default tidak ditemukan", async () => {
    mockProfilesMaybeSingle.mockResolvedValueOnce({
      data: null,
      error: null,
    })

    const result = await updateJobStatus("job-uuid-1", "saved")

    expect(result).toEqual({
      success: false,
      error: "Profil tidak ditemukan.",
    })
    expect(mockApplicationsUpsert).not.toHaveBeenCalled()
  })

  it("Case 8 (Negative - Database Upsert Error): menangani kegagalan PostgREST secara graceful", async () => {
    mockApplicationsUpsert.mockResolvedValueOnce({
      error: { message: "Database connection closed unexpectedly" },
    })

    const result = await updateJobStatus("job-uuid-1", "saved")

    expect(result).toEqual({
      success: false,
      error: "Database connection closed unexpectedly",
    })
    expect(mockRecordAuditLog).not.toHaveBeenCalled()
    expect(mockRevalidatePath).not.toHaveBeenCalled()
  })

  it("Case 9 (Negative - Unexpected Exception): menangkap exception tak terduga dan mengembalikan typed error", async () => {
    mockApplicationsUpsert.mockRejectedValueOnce(
      new Error("Fatal network driver failure")
    )

    const result = await updateJobStatus("job-uuid-1", "saved")

    expect(result).toEqual({
      success: false,
      error: "Fatal network driver failure",
    })
  })
})
