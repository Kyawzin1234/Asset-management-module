import { db } from '@/lib/db'
import { json, badRequest, serverError } from '@/lib/api-helpers'

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const code = url.searchParams.get('company') || 'ACME'
    const q = url.searchParams.get('q') || ''
    const company = await db.company.findUnique({ where: { code } })
    if (!company) return badRequest('Unknown company scope')
    const where = {
      companyId: company.id,
      ...(q ? { name: { contains: q } } : {}),
    }
    const vendors = await db.vendor.findMany({
      where,
      orderBy: { rating: 'desc' },
      include: {
        _count: { select: { repairs: true, licenses: true } },
      },
    })
    return json({ vendors, total: vendors.length })
  } catch (e) {
    return serverError(e)
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const company = await db.company.findUnique({ where: { code: body.company || 'ACME' } })
    if (!company) return badRequest('Unknown company scope')
    if (!body.name) return badRequest('Vendor name is required')
    const vendor = await db.vendor.create({
      data: {
        name: body.name,
        category: body.category || 'Hardware',
        contact: body.contact || null,
        email: body.email || null,
        phone: body.phone || null,
        address: body.address || null,
        rating: Number(body.rating) || 4,
        companyId: company.id,
      },
    })
    return json({ vendor })
  } catch (e) {
    return serverError(e)
  }
}
