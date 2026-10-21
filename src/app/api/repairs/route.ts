import { db } from '@/lib/db'
import { json, badRequest, serverError } from '@/lib/api-helpers'

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const code = url.searchParams.get('company') || 'ACME'
    const status = url.searchParams.get('status') || 'ALL'
    const company = await db.company.findUnique({ where: { code } })
    if (!company) return badRequest('Unknown company scope')
    const where = {
      asset: { companyId: company.id },
      ...(status !== 'ALL' ? { status } : {}),
    }
    const [total, list] = await Promise.all([
      db.repairRecord.count({ where }),
      db.repairRecord.findMany({
        where,
        orderBy: { reportedAt: 'desc' },
        include: { asset: { select: { assetTag: true, name: true } }, vendor: { select: { id: true, name: true } } },
      }),
    ])
    const vendors = await db.vendor.findMany({ where: { companyId: company.id }, select: { id: true, name: true } })
    return json({ repairs: list, total, vendors })
  } catch (e) {
    return serverError(e)
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json()
    if (!body.id) return badRequest('Repair record id required')
    const data: Record<string, unknown> = {}
    if (body.status) {
      data.status = body.status
      if (body.status === 'RESOLVED') data.resolvedAt = new Date()
    }
    if (body.repairCost !== undefined) data.repairCost = Number(body.repairCost)
    const rec = await db.repairRecord.update({ where: { id: body.id }, data })
    if (body.status === 'RESOLVED') {
      await db.asset.update({ where: { id: rec.assetId }, data: { status: 'IN_STOCK' } })
    }
    return json({ repair: rec })
  } catch (e) {
    return serverError(e)
  }
}
