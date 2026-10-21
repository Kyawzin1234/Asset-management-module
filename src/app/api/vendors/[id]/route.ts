import { db } from '@/lib/db'
import { json, badRequest, serverError, audit } from '@/lib/api-helpers'

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const existing = await db.vendor.findUnique({ where: { id } })
    if (!existing) return badRequest('Vendor not found')
    await db.$transaction(async (tx) => {
      // keep history records, just unlink them from this vendor
      await tx.repairRecord.updateMany({ where: { vendorId: id }, data: { vendorId: null } })
      await tx.softwareLicense.updateMany({ where: { vendorId: id }, data: { vendorId: null } })
      await tx.vendor.delete({ where: { id } })
    })
    await audit({
      category: 'System Config Edit',
      affectedRecord: existing.name,
      actionDetails: 'Vendor partner removed from directory — linked RMA cases & license pools unlinked',
      severity: 'WARNING',
    })
    return json({ ok: true })
  } catch (e) {
    return serverError(e)
  }
}
