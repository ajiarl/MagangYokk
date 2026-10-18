import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from '@/app/api/health/route'

vi.mock('server-only', () => ({}))

const { mockSelect, mockFrom } = vi.hoisted(() => {
  const select = vi.fn()
  const from = vi.fn(() => ({
    select,
  }))
  return { mockSelect: select, mockFrom: from }
})

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: mockFrom,
  },
}))

describe('/api/health Route Handler', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('mengembalikan status 200 saat koneksi Supabase sehat', async () => {
    mockSelect.mockResolvedValueOnce({ error: null, count: 42 })

    const response = await GET()
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.status).toBe('healthy')
    expect(json.database).toBe('connected')
    expect(typeof json.latencyMs).toBe('number')
    expect(typeof json.uptime).toBe('number')
    expect(new Date(json.timestamp).toString()).not.toBe('Invalid Date')
    expect(mockFrom).toHaveBeenCalledWith('jobs')
    expect(mockSelect).toHaveBeenCalledWith('count', { count: 'exact', head: true })
  })

  it('mengembalikan status 503 saat query Supabase mengembalikan error', async () => {
    mockSelect.mockResolvedValueOnce({
      error: { message: 'Database query timeout' },
      count: null,
    })

    const response = await GET()
    const json = await response.json()

    expect(response.status).toBe(503)
    expect(json.status).toBe('unhealthy')
    expect(json.database).toBe('disconnected')
    expect(json.error).toBe('Database query timeout')
    expect(typeof json.latencyMs).toBe('number')
    expect(typeof json.uptime).toBe('number')
  })

  it('mengembalikan status 503 saat eksekusi query melempar exception', async () => {
    mockSelect.mockRejectedValueOnce(new Error('Network connection failed'))

    const response = await GET()
    const json = await response.json()

    expect(response.status).toBe(503)
    expect(json.status).toBe('unhealthy')
    expect(json.database).toBe('disconnected')
    expect(json.error).toBe('Network connection failed')
  })
})
