import { db } from '@/lib/db'
import { json, badRequest, serverError, audit } from '@/lib/api-helpers'

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const code = url.searchParams.get('company') || 'ACME'
    const q = url.searchParams.get('q') || ''
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'))
    const pageSize = Math.min(100, Math.max(5, parseInt(url.searchParams.get('pageSize') || '10')))
    const company = await db.company.findUnique({ where: { code } })
    if (!company) return badRequest('Unknown company scope')
    const where = {
      assignment: { asset: { companyId: company.id } },
      ...(q ? { OR: [{ returnId: { contains: q } }, { assignment: { asset: { assetTag: { contains: q } } } }] } : {}),
    }
    const [total, list] = await Promise.all([
      db.returnRecord.count({ where }),
      db.returnRecord.findMany({
        where,
        orderBy: { returnedAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { assignment: { include: { asset: { select: { assetTag: true, name: true } }, employee: { select: { name: true } } } } },
      }),
    ])
    return json({ returns: list, total, page, pageSize })
  } catch (e) {
    return serverError(e)
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    if (!body.assignmentId) return badRequest('Assignment is required')
    const asg = await db.assignment.findUnique({
      where: { id: body.assignmentId },
      include: { asset: true, employee: true },
    })
    if (!asg) return badRequest('Assignment not found')
    if (asg.status !== 'ACTIVE') return badRequest('This assignment is already closed')
    const count = await db.returnRecord.count()
    const ret = await db.$transaction(async (tx) => {
      const created = await tx.returnRecord.create({
        data: {
          returnId: `RET-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`,
          assignmentId: asg.id,
          condition: body.condition || 'Good',
          reason: body.reason || 'Routine Swap',
          processedBy: body.processedBy || 'Sarah Jenkins',
          notes: body.notes || null,
        },
      })
      await tx.assignment.update({ where: { id: asg.id }, data: { status: 'RETURNED', returnedAt: new Date() } })
      await tx.asset.update({ where: { id: asg.assetId }, data: { status: body.markRepair ? 'REPAIR' : 'IN_STOCK', condition: body.condition || 'Good' } })
      return created
    })
    await audit({
      category: 'Asset Return',
      affectedRecord: asg.asset.assetTag,
      actionDetails: `Custody returned by ${asg.employee.name} — condition verified & ${body.markRepair ? 'routed to repair' : 'restocked'}`,
    })
    return json({ return: ret })
  } catch (e) {
    return serverError(e)
  }
}
