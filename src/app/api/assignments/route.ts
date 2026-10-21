import { db } from '@/lib/db'
import { json, badRequest, serverError, audit } from '@/lib/api-helpers'

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const code = url.searchParams.get('company') || 'ACME'
    const status = url.searchParams.get('status') || 'ACTIVE'
    const q = url.searchParams.get('q') || ''
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'))
    const pageSize = Math.min(100, Math.max(5, parseInt(url.searchParams.get('pageSize') || '10')))
    const company = await db.company.findUnique({ where: { code } })
    if (!company) return badRequest('Unknown company scope')
    const where = {
      status,
      asset: { companyId: company.id },
      ...(q ? { OR: [{ receiptId: { contains: q } }, { asset: { assetTag: { contains: q } } }, { employee: { name: { contains: q } } }] } : {}),
    }
    const [total, list] = await Promise.all([
      db.assignment.count({ where }),
      db.assignment.findMany({
        where,
        orderBy: { issuedAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { asset: { select: { assetTag: true, name: true, category: true } }, employee: { select: { name: true, department: true, designation: true } } },
      }),
    ])
    return json({ assignments: list, total, page, pageSize })
  } catch (e) {
    return serverError(e)
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    if (!body.assetId || !body.employeeId) return badRequest('Asset and employee are required')
    const asset = await db.asset.findUnique({ where: { id: body.assetId }, include: { company: true } })
    if (!asset) return badRequest('Asset not found')
    if (asset.status !== 'IN_STOCK') return badRequest('Only in-stock assets can be assigned')
    const employee = await db.employee.findUnique({ where: { id: body.employeeId } })
    if (!employee) return badRequest('Employee not found')
    const count = await db.assignment.count()
    const asg = await db.$transaction(async (tx) => {
      const created = await tx.assignment.create({
        data: {
          receiptId: `ASG-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`,
          assetId: asset.id,
          employeeId: employee.id,
          expectedReturnAt: body.expectedReturnAt ? new Date(body.expectedReturnAt) : new Date(Date.now() + 365 * 86400000),
          signoffBy: body.signoffBy || 'Sarah Jenkins',
          notes: body.notes || 'Signed handover receipt on file.',
          status: 'ACTIVE',
        },
      })
      await tx.asset.update({ where: { id: asset.id }, data: { status: 'ASSIGNED' } })
      return created
    })
    await audit({
      category: 'Asset Assignment',
      affectedRecord: asset.assetTag,
      actionDetails: `Assigned custody to ${employee.name} (${employee.department})`,
    })
    return json({ assignment: asg })
  } catch (e) {
    return serverError(e)
  }
}
