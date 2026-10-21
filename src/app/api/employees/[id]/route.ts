import { db } from '@/lib/db'
import { json, badRequest, serverError, audit, formatIST } from '@/lib/api-helpers'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const employee = await db.employee.findUnique({ where: { id }, include: { company: true } })
    if (!employee) return badRequest('Employee not found')
    const assignments = await db.assignment.findMany({
      where: { employeeId: id },
      orderBy: { issuedAt: 'desc' },
      take: 50,
      include: { asset: { select: { assetTag: true, name: true, category: true, status: true } } },
    })
    return json({ employee, assignments: assignments.map((a) => ({ ...a, issuedIST: formatIST(a.issuedAt) })) })
  } catch (e) {
    return serverError(e)
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const existing = await db.employee.findUnique({ where: { id } })
    if (!existing) return badRequest('Employee not found')
    const active = await db.assignment.count({ where: { employeeId: id, status: 'ACTIVE' } })
    if (active > 0) {
      return badRequest(`Employee holds ${active} asset${active > 1 ? 's' : ''} in active custody — process a return first`)
    }
    const assignments = await db.assignment.findMany({ where: { employeeId: id }, select: { id: true } })
    await db.$transaction(async (tx) => {
      for (const a of assignments) {
        await tx.transferRecord.deleteMany({ where: { assignmentId: a.id } })
        await tx.returnRecord.deleteMany({ where: { assignmentId: a.id } })
      }
      await tx.assignment.deleteMany({ where: { employeeId: id } })
      await tx.employee.delete({ where: { id } })
    })
    await audit({
      category: 'System Config Edit',
      affectedRecord: existing.empCode,
      actionDetails: `Employee ${existing.name} removed from directory — ${assignments.length} custody history record(s) purged`,
      severity: 'WARNING',
    })
    return json({ ok: true })
  } catch (e) {
    return serverError(e)
  }
}
