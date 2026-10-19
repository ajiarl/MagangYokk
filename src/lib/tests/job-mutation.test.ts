import { describe, it, expect, vi, beforeEach } from "vitest"
import { updateJobStatus } from "@/app/actions"
import { ApplicationStatus } from "@/lib/types"

vi.mock("server-only", () => ({}))

const {
  mockHeadersGet,
  mockRevalidatePath,
  mockRecordAuditLog,
  mockGetUser,
  mockProfilesMaybeSingle,
  mockApplicationsUpsert,
  mockFrom,
  mockCreateClient,
} = vi.hoisted(() => {
  const headersGet = vi.fn()
  const revalidatePath = vi.fn()
  const recordAuditLog = vi.fn().mockResolvedValue(undefined)

  const getUser = vi.fn()
  const maybeSingle = vi.fn()
  const eq = vi.fn(() => ({ maybeSingle }))
  const select = vi.fn(() => ({ eq }))

  const insertSingle = vi.fn()
  const insertSelect = vi.fn(() => ({ single: insertSingle }))
  const insert = vi.fn(() => ({ select: insertSelect }))

  const upsert = vi.fn()

  const from = vi.fn((table: string) => {
    if (table === "profiles") {
      return { select, insert }
    }
    if (table === "applications") {
      return { upsert }
    }
    return {}
  })

  const createClient = vi.fn(async () => ({
    auth: {
      getUser,
    },
    from,
  }))

  return {
    mockHeadersGet: headersGet,
    mockRevalidatePath: revalidatePath,
    mockRecordAuditLog: recordAuditLog,
    mockGetUser: getUser,
    mockProfilesMaybeSingle: maybeSingle,
    mockApplicationsUpsert: upsert,
    mockFrom: from,
    mockCreateClient: createClient,
  }
})

vi.mock("next/headers", () => ({
  headers: vi.fn(async () => ({
    get: mockHeadersGet,
  })),
  cookies: vi.fn(async () => ({
    get: vi.fn(() => undefined),
    getAll: vi.fn(() => []),
    set: vi.fn(),
  })),
}))

vi.mock("next/cache", () => ({
  revalidatePath: mockRevalidatePath,
}))

vi.mock("@/lib/audit-trail", () => ({
  recordAuditLog: mockRecordAuditLog,
}))

vi.mock("@/lib/supabase/server", () => ({
  createClient: mockCreateClient,
}))

describe("Server Action: updateJobStatus Integration Tests (Multi-User SSR)", () => {
  const mockUser = {
    id: "user-uuid-999",
    email: "mahasiswa@kampus.ac.id",
    user_metadata: { full_name: "Mahasiswa IT" },
  }

  const mockProfile = {
    id: "profile-uuid-123",
    full_name: "Mahasiswa IT",
    skills: ["React", "TypeScript"],
    bio: null,
  }

  beforeEach(() => {
    vi.clearAllMocks()

    // Default headers
    mockHeadersGet.mockImplementation((key: string) => {
      if (key.toLowerCase() === "x-forwarded-for") return "203.0.113.195, 10.0.0.1"
      return null
    })

    // Default authenticated user
    mockGetUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    })

    // Default existing profile
    mockProfilesMaybeSingle.mockResolvedValue({
      data: mockProfile,
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
        profile_id: "profile-uuid-123",
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
        profile_id: "profile-uuid-123",
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
      mockGetUser.mockResolvedValue({ data: { user: mockUser }, error: null })
      mockProfilesMaybeSingle.mockResolvedValue({ data: mockProfile, error: null })
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

  it("Case 4 (Negative - Unauthenticated Request): permintaan ditolak jika user belum login", async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: null },
      error: new Error("JWT expired"),
    })

    const result = await updateJobStatus("job-uuid-1", "saved")

    expect(result).toEqual({
      success: false,
      error: "Silakan masuk terlebih dahulu untuk mengelola lamaran.",
    })
    expect(mockApplicationsUpsert).not.toHaveBeenCalled()
    expect(mockRecordAuditLog).not.toHaveBeenCalled()
  })

  it("Case 5 (Negative - Invalid Status Outside Enum): menolak status yang tidak terdaftar dalam ALLOWED_STATUSES", async () => {
    // @ts-expect-error Pengujian input runtime ilegal
    const result = await updateJobStatus("job-uuid-1", "hired")

    expect(result).toEqual({
      success: false,
      error: "Status lamaran tidak valid.",
    })
    expect(mockApplicationsUpsert).not.toHaveBeenCalled()
  })

  it("Case 6 (Negative - Invalid Job ID): menolak jobId kosong, spasi saja, atau melebihi 128 karakter", async () => {
    const emptyResult = await updateJobStatus("", "saved")
    expect(emptyResult).toEqual({
      success: false,
      error: "ID lowongan tidak valid.",
    })

    const whitespaceResult = await updateJobStatus("   ", "saved")
    expect(whitespaceResult).toEqual({
      success: false,
      error: "ID lowongan tidak valid.",
    })

    const tooLongJobId = "a".repeat(129)
    const longResult = await updateJobStatus(tooLongJobId, "saved")
    expect(longResult).toEqual({
      success: false,
      error: "ID lowongan tidak valid.",
    })

    expect(mockApplicationsUpsert).not.toHaveBeenCalled()
  })

  it("Case 7 (Negative - Database Upsert Error): menangani kegagalan PostgREST secara graceful", async () => {
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

  it("Case 8 (Negative - Unexpected Exception): menangkap exception tak terduga dan mengembalikan typed error", async () => {
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
