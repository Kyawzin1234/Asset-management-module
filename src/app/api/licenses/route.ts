import { db } from '@/lib/db'
import { json, badRequest, serverError } from '@/lib/api-helpers'

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const code = url.searchParams.get('company') || 'ACME'
    const q = url.searchParams.get('q') || ''
    const expiring = url.searchParams.get('expiring') === '1'
    const company = await db.company.findUnique({ where: { code } })
    if (!company) return badRequest('Unknown company scope')
    const now = new Date()
    const in90 = new Date(now.getTime() + 90 * 86400000)
    const where = {
      companyId: company.id,
      ...(expiring ? { expiresAt: { gte: now, lte: in90 } } : {}),
      ...(q ? { name: { contains: q } } : {}),
    }
    const [total, list] = await Promise.all([
      db.softwareLicense.count({ where }),
      db.softwareLicense.findMany({
        where,
        orderBy: { expiresAt: 'asc' },
        include: { vendor: { select: { id: true, name: true } } },
      }),
    ])
    const vendors = await db.vendor.findMany({ where: { companyId: company.id, category: 'Software' }, select: { id: true, name: true } })
    return json({ licenses: list, total, vendors })
  } catch (e) {
    return serverError(e)
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const company = await db.company.findUnique({ where: { code: body.company || 'ACME' } })
    if (!company) return badRequest('Unknown company scope')
    if (!body.name) return badRequest('License name is required')
    const lic = await db.softwareLicense.create({
      data: {
        name: body.name,
        vendorId: body.vendorId || null,
        licenseKey: body.licenseKey || null,
        seats: Number(body.seats) || 1,
        seatsUsed: Number(body.seatsUsed) || 0,
        type: body.type || 'Subscription',
        expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
        costPerSeat: Number(body.costPerSeat) || 0,
        companyId: company.id,
      },
    })
    return json({ license: lic })
  } catch (e) {
    return serverError(e)
  }
}
