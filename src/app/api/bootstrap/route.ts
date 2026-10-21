import { db } from '@/lib/db'
import { json, serverError } from '@/lib/api-helpers'

export async function GET() {
  try {
    const companies = await db.company.findMany({
      orderBy: { createdAt: 'asc' },
      select: { id: true, code: true, name: true, industry: true, location: true },
    })
    const acmeAssets = await db.asset.count({ where: { company: { code: 'ACME' } } })
    const now = new Date()
    const in60 = new Date(now.getTime() + 60 * 86400000)
    const acmeWarranty = await db.asset.count({ where: { company: { code: 'ACME' }, warrantyEnd: { lte: in60, gte: now } } })
    const acmeLicExpiring = await db.softwareLicense.count({ where: { company: { code: 'ACME' }, expiresAt: { lte: in60, gte: now } } })
    return json({
      companies,
      badges: {
        inventory: acmeAssets,
        softwareExpiry: acmeWarranty + acmeLicExpiring,
      },
    })
  } catch (e) {
    return serverError(e)
  }
}
