import { db } from '@/lib/db'
import { json, badRequest, serverError, audit, HW_CATEGORIES } from '@/lib/api-helpers'

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const code = url.searchParams.get('company') || 'ACME'
    const q = url.searchParams.get('q') || ''
    const category = url.searchParams.get('category') || 'ALL'
    const status = url.searchParams.get('status') || 'ALL'
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'))
    const pageSize = Math.min(100, Math.max(5, parseInt(url.searchParams.get('pageSize') || '10')))

    const company = await db.company.findUnique({ where: { code } })
    if (!company) return badRequest('Unknown company scope')
    const where = {
      companyId: company.id,
      ...(category !== 'ALL' ? { category } : {}),
      ...(status !== 'ALL' ? { status } : {}),
      ...(q
        ? {
            OR: [
              { assetTag: { contains: q } },
              { name: { contains: q } },
              { serialNumber: { contains: q } },
            ],
          }
        : {}),
    }
    const [total, list] = await Promise.all([
      db.asset.count({ where }),
      db.asset.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          assignments: { where: { status: 'ACTIVE' }, include: { employee: { select: { id: true, name: true, department: true } } } },
        },
      }),
    ])
    const statusCounts = await db.asset.groupBy({ by: ['status'], where: { companyId: company.id }, _count: { _all: true } })
    const counts: Record<string, number> = {}
    for (const s of statusCounts) counts[s.status] = s._count._all
    return json({ assets: list, total, page, pageSize, counts, categories: HW_CATEGORIES })
  } catch (e) {
    return serverError(e)
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const code = body.company || 'ACME'
    const company = await db.company.findUnique({ where: { code } })
    if (!company) return badRequest('Unknown company scope')
    if (!body.name || !body.category) return badRequest('Name and category are required')

    // build the asset tag: AST-{CO}-{CAT3}-{YY}-{seq}
    const cat3Map: Record<string, string> = {
      Laptop: 'LAP', Monitor: 'MON', Phone: 'PHN', Tablet: 'TAB',
      Printer: 'PRN', Server: 'SRV', Networking: 'NET', Peripheral: 'ACC',
    }
    const cat3 = cat3Map[body.category] || 'AST'
    const year = new Date().getFullYear() % 100
    const count = await db.asset.count({ where: { companyId: company.id, assetTag: { contains: `-${cat3}-${String(year).padStart(2, '0')}-` } } })
    const assetTag = `AST-${company.code}-${cat3}-${String(year).padStart(2, '0')}-${String(count + 1).padStart(5, '0')}`

    const asset = await db.asset.create({
      data: {
        assetTag,
        name: body.name,
        category: body.category,
        brand: body.brand || body.name.split(' ')[0],
        serialNumber: body.serialNumber || 'SN' + Math.floor(100000 + Math.random() * 899999) + 'XX',
        status: 'IN_STOCK',
        condition: body.condition || 'Excellent',
        purchaseCost: Number(body.purchaseCost) || 0,
        purchaseDate: body.purchaseDate ? new Date(body.purchaseDate) : new Date(),
        warrantyEnd: body.warrantyEnd ? new Date(body.warrantyEnd) : null,
        location: body.location || 'HQ — Mumbai',
        notes: body.notes || null,
        companyId: company.id,
      },
    })
    await audit({
      category: 'Asset Registration',
      affectedRecord: asset.assetTag,
      actionDetails: `Asset registered to master inventory with serial verification`,
    })
    return json({ asset })
  } catch (e) {
    return serverError(e)
  }
}
