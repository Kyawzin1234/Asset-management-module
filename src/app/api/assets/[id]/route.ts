import { db } from '@/lib/db'
import { json, badRequest, serverError, audit } from '@/lib/api-helpers'

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const existing = await db.asset.findUnique({ where: { id } })
    if (!existing) return badRequest('Asset not found')
    const data: Record<string, unknown> = {}
    for (const k of ['name', 'category', 'brand', 'serialNumber', 'condition', 'location', 'notes']) {
      if (body[k] !== undefined) data[k] = body[k]
    }
    if (body.purchaseCost !== undefined) data.purchaseCost = Number(body.purchaseCost)
    if (body.warrantyEnd !== undefined) data.warrantyEnd = body.warrantyEnd ? new Date(body.warrantyEnd) : null
    if (body.status !== undefined) {
      // Guard: cannot mark assigned here — use the Assign flow
      if (body.status === 'ASSIGNED') return badRequest('Use the Assign Assets flow to place an asset in custody')
      data.status = body.status
    }
    const asset = await db.asset.update({ where: { id }, data })
    if (body.status && body.status !== existing.status) {
      const cat: Record<string, string> = { REPAIR: 'Repair Intake', IN_STOCK: 'Asset Return', RETIRED: 'System Config Edit' }
      const det: Record<string, string> = {
        REPAIR: 'RMA case opened with vendor service desk — unit flagged under repair',
        IN_STOCK: 'Custody cleared — condition verified & restocked',
        RETIRED: 'Asset retired from active inventory scope',
      }
      await audit({
        category: cat[body.status] ?? 'System Config Edit',
        affectedRecord: asset.assetTag,
        actionDetails: det[body.status] ?? `Status changed ${existing.status} → ${body.status}`,
        severity: body.status === 'RETIRED' ? 'WARNING' : 'INFO',
      })
    }
    return json({ asset })
  } catch (e) {
    return serverError(e)
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const existing = await db.asset.findUnique({ where: { id } })
    if (!existing) return badRequest('Asset not found')
    if (existing.status === 'ASSIGNED') return badRequest('Asset is in active custody — process a return first')
    const assignments = await db.assignment.findMany({ where: { assetId: id }, select: { id: true } })
    await db.$transaction(async (tx) => {
      for (const a of assignments) {
        await tx.transferRecord.deleteMany({ where: { assignmentId: a.id } })
        await tx.returnRecord.deleteMany({ where: { assignmentId: a.id } })
      }
      await tx.assignment.deleteMany({ where: { assetId: id } })
      await tx.repairRecord.deleteMany({ where: { assetId: id } })
      await tx.asset.delete({ where: { id } })
    })
    await audit({
      category: 'System Config Edit',
      affectedRecord: existing.assetTag,
      actionDetails: `Asset record removed from inventory scope — ${assignments.length} custody history record(s) purged`,
      severity: 'WARNING',
    })
    return json({ ok: true })
  } catch (e) {
    return serverError(e)
  }
}
