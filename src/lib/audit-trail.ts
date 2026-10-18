import 'server-only'
import { createHash } from 'crypto'
import { supabase } from '@/lib/supabase'

/**
 * Pseudonimisasi alamat IP menggunakan SHA-256 untuk kepatuhan UU PDP No. 27/2022.
 * Menghasilkan hash 16-karakter tanpa menyimpan IP mentah (Zero PII).
 */
export function hashIp(ip?: string | null): string {
  if (!ip || ip.trim() === '') {
    return 'anonymous'
  }
  return createHash('sha256').update(ip.trim()).digest('hex').slice(0, 16)
}

export interface AuditLogEntry {
  actionType: 'STATUS_CHANGE' | 'NOTE_UPDATE' | 'RESUME_UPLOAD' | string
  entityId: string
  payloadSummary?: Record<string, unknown>
  rawIp?: string | null
}

/**
 * Pencatatan riwayat audit untuk tindakan sensitif (mutasi status, catatan, upload CV).
 * Berjalan secara non-blocking dan toleran terhadap kegagalan database sehingga alur utama
 * pengguna tetap berhasil 100%.
 */
export async function recordAuditLog(entry: AuditLogEntry): Promise<void> {
  try {
    const ip_hash = hashIp(entry.rawIp)
    const { error } = await supabase.from('audit_logs').insert({
      action_type: entry.actionType,
      entity_id: entry.entityId,
      payload_summary: entry.payloadSummary || {},
      ip_hash,
    })

    if (error) {
      console.warn('[AuditTrail] Non-blocking notice (insert log failed):', error.message)
    }
  } catch (err: unknown) {
    console.warn('[AuditTrail] Non-blocking exception caught:', err)
  }
}
