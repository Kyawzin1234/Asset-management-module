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
      ...(q ? { OR: [{ transferId: { contains: q } }, { assignment: { asset: { assetTag: { contains: q } } } }] } : {}),
    }
    const [total, list] = await Promise.all([
      db.transferRecord.count({ where }),
      db.transferRecord.findMany({
        where,
        orderBy: { transferredAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { assignment: { include: { asset: { select: { assetTag: true, name: true } } } } },
      }),
    ])
    return json({ transfers: list, total, page, pageSize })
  } catch (e) {
    return serverError(e)
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    if (!body.assignmentId || !body.toDept) return badRequest('Assignment and target department are required')
    const asg = await db.assignment.findUnique({
      where: { id: body.assignmentId },
      include: { asset: { include: { company: true } }, employee: true },
    })
    if (!asg) return badRequest('Assignment not found')
    if (asg.status !== 'ACTIVE') return badRequest('Only active custody can be transferred')
    const count = await db.transferRecord.count()
    const trf = await db.transferRecord.create({
      data: {
        transferId: `TRF-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`,
        assignmentId: asg.id,
        fromDept: body.fromDept || asg.employee.department,
        toDept: body.toDept,
        fromCompany: asg.asset.company?.name ?? 'Acme Corp Ltd',
        toCompany: body.toCompany || 'Acme Corp Ltd',
        operator: body.operator || 'Sarah Jenkins',
        reason: body.reason || 'Inter-departmental project move',
      },
    })
    await audit({
      category: 'Custody Transfer',
      affectedRecord: asg.asset.assetTag,
      actionDetails: `Custody transferred ${body.fromDept || asg.employee.department} → ${body.toDept}, chain-of-custody re-signed`,
    })
    return json({ transfer: trf })
  } catch (e) {
    return serverError(e)
  }
}
