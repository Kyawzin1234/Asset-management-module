import { db } from '@/lib/db'
import { json, badRequest, serverError, audit } from '@/lib/api-helpers'

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const existing = await db.softwareLicense.findUnique({ where: { id } })
    if (!existing) return badRequest('License not found')
    await db.softwareLicense.delete({ where: { id } })
    await audit({
      category: 'System Config Edit',
      affectedRecord: existing.name,
      actionDetails: `Software license removed — ${existing.seats} seat(s) released from the pool`,
      severity: 'WARNING',
    })
    return json({ ok: true })
  } catch (e) {
    return serverError(e)
  }
}
