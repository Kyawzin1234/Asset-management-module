import { db } from '@/lib/db'
import { json, serverError } from '@/lib/api-helpers'

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const q = (url.searchParams.get('q') || '').trim()
    if (!q) return json({ assets: [], employees: [] })
    const [assets, employees] = await Promise.all([
      db.asset.findMany({
        where: { OR: [{ assetTag: { contains: q } }, { name: { contains: q } }, { serialNumber: { contains: q } }] },
        take: 6,
        select: { id: true, assetTag: true, name: true, status: true, category: true },
      }),
      db.employee.findMany({
        where: { OR: [{ name: { contains: q } }, { empCode: { contains: q } }, { email: { contains: q } }] },
        take: 5,
        select: { id: true, name: true, empCode: true, department: true },
      }),
    ])
    return json({ assets, employees })
  } catch (e) {
    return serverError(e)
  }
}
