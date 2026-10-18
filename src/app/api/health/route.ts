import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET() {
  const startTime = Date.now()

  try {
    const { error } = await supabase
      .from('jobs')
      .select('count', { count: 'exact', head: true })

    const latencyMs = Date.now() - startTime

    if (error) {
      return NextResponse.json(
        {
          status: 'unhealthy',
          timestamp: new Date().toISOString(),
          latencyMs,
          database: 'disconnected',
          uptime: process.uptime(),
          error: error.message,
        },
        { status: 503 }
      )
    }

    return NextResponse.json(
      {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        latencyMs,
        database: 'connected',
        uptime: process.uptime(),
      },
      { status: 200 }
    )
  } catch (err: unknown) {
    const latencyMs = Date.now() - startTime
    const errorMessage = err instanceof Error ? err.message : String(err)

    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        latencyMs,
        database: 'disconnected',
        uptime: process.uptime(),
        error: errorMessage,
      },
      { status: 503 }
    )
  }
}
