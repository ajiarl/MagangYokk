import type { NextRequest } from "next/server"

export interface RateLimitOptions {
  limit: number
  windowMs: number
}

export interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  resetTime: number
}

interface WindowData {
  timestamps: number[]
}

const rateLimitStore = new Map<string, WindowData>()
let lastCleanup = Date.now()
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000 // 5 menit

function cleanupExpiredEntries(now: number): void {
  for (const [key, data] of rateLimitStore.entries()) {
    // Retain only timestamps from the last hour at most
    data.timestamps = data.timestamps.filter((ts) => now - ts < 60 * 60 * 1000)
    if (data.timestamps.length === 0) {
      rateLimitStore.delete(key)
    }
  }
  lastCleanup = now
}

export function checkRateLimit(key: string, options: RateLimitOptions): RateLimitResult {
  const now = Date.now()

  // Periodic garbage collection
  if (now - lastCleanup > CLEANUP_INTERVAL_MS) {
    cleanupExpiredEntries(now)
  }

  const windowStart = now - options.windowMs
  let record = rateLimitStore.get(key)

  if (!record) {
    record = { timestamps: [] }
    rateLimitStore.set(key, record)
  }

  // Filter timestamps within the current sliding window
  record.timestamps = record.timestamps.filter((ts) => ts > windowStart)

  if (record.timestamps.length >= options.limit) {
    const oldest = record.timestamps[0] ?? now
    const resetTime = oldest + options.windowMs
    return {
      success: false,
      limit: options.limit,
      remaining: 0,
      resetTime,
    }
  }

  record.timestamps.push(now)
  const remaining = Math.max(0, options.limit - record.timestamps.length)
  const resetTime = now + options.windowMs

  return {
    success: true,
    limit: options.limit,
    remaining,
    resetTime,
  }
}

export function getClientIp(req: Request | NextRequest): string {
  const headers = req.headers

  // Vercel / Cloudflare / Standard proxy headers
  const cfConnectingIp = headers.get("cf-connecting-ip")
  if (cfConnectingIp) {
    return cfConnectingIp.trim()
  }

  const xForwardedFor = headers.get("x-forwarded-for")
  if (xForwardedFor) {
    const firstIp = xForwardedFor.split(",")[0]?.trim()
    if (firstIp) return firstIp
  }

  const xRealIp = headers.get("x-real-ip")
  if (xRealIp) {
    return xRealIp.trim()
  }

  return "127.0.0.1"
}
