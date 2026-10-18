import { describe, it, expect, vi, beforeEach } from 'vitest'
import { hashIp, recordAuditLog } from '@/lib/audit-trail'

vi.mock('server-only', () => ({}))

const { mockInsert, mockFrom } = vi.hoisted(() => {
  const insert = vi.fn()
  const from = vi.fn(() => ({
    insert,
  }))
  return { mockInsert: insert, mockFrom: from }
})

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: mockFrom,
  },
}))

describe('Audit Trail Utility (src/lib/audit-trail.ts)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('hashIp', () => {
    it('mengembalikan "anonymous" saat IP null, undefined, atau string kosong', () => {
      expect(hashIp(null)).toBe('anonymous')
      expect(hashIp(undefined)).toBe('anonymous')
      expect(hashIp('')).toBe('anonymous')
      expect(hashIp('   ')).toBe('anonymous')
    })

    it('menghasilkan hash 16 karakter deterministik untuk IP yang diberikan', () => {
      const hash1 = hashIp('192.168.1.1')
      const hash2 = hashIp('192.168.1.1')
      expect(hash1).toBe(hash2)
      expect(hash1).toHaveLength(16)
      expect(hash1).toMatch(/^[0-9a-f]{16}$/)
    })

    it('melakukan trim sebelum hashing sehingga IP dengan spasi menghasilkan hash yang sama', () => {
      expect(hashIp('  10.0.0.1  ')).toBe(hashIp('10.0.0.1'))
    })
  })

  describe('recordAuditLog', () => {
    it('memasukkan log ke tabel audit_logs dengan payload yang benar', async () => {
      mockInsert.mockResolvedValueOnce({ error: null })

      await recordAuditLog({
        actionType: 'STATUS_CHANGE',
        entityId: 'job-123',
        payloadSummary: { status: 'applied' },
        rawIp: '127.0.0.1',
      })

      expect(mockFrom).toHaveBeenCalledWith('audit_logs')
      expect(mockInsert).toHaveBeenCalledWith({
        action_type: 'STATUS_CHANGE',
        entity_id: 'job-123',
        payload_summary: { status: 'applied' },
        ip_hash: hashIp('127.0.0.1'),
      })
    })

    it('bekerja gracefully (non-blocking) saat Supabase mengembalikan error', async () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      mockInsert.mockResolvedValueOnce({
        error: { message: 'relation "audit_logs" does not exist' },
      })

      await expect(
        recordAuditLog({
          actionType: 'RESUME_UPLOAD',
          entityId: 'profile-1',
          rawIp: null,
        })
      ).resolves.not.toThrow()

      expect(warnSpy).toHaveBeenCalled()
      warnSpy.mockRestore()
    })

    it('bekerja gracefully saat Supabase melempar exception jaringan', async () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      mockInsert.mockRejectedValueOnce(new Error('Network connection timeout'))

      await expect(
        recordAuditLog({
          actionType: 'NOTE_UPDATE',
          entityId: 'job-456',
        })
      ).resolves.not.toThrow()

      expect(warnSpy).toHaveBeenCalled()
      warnSpy.mockRestore()
    })
  })
})
