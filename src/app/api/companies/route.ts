import { db } from '@/lib/db'
import { json, serverError } from '@/lib/api-helpers'

export async function GET() {
  try {
    const companies = await db.company.findMany({ orderBy: { createdAt: 'asc' } })
    const out: Array<Awaited<ReturnType<typeof db.company.findMany>>[number] & {
      stats: { assets: number; assigned: number; repair: number; employees: number; licenses: number; utilization: number }
    }> = []
    for (const c of companies) {
      const [assets, assigned, repair, employees, licenses] = await Promise.all([
        db.asset.count({ where: { companyId: c.id } }),
        db.asset.count({ where: { companyId: c.id, status: 'ASSIGNED' } }),
        db.asset.count({ where: { companyId: c.id, status: 'REPAIR' } }),
        db.employee.count({ where: { companyId: c.id } }),
        db.softwareLicense.count({ where: { companyId: c.id } }),
      ])
      out.push({
        ...c,
        stats: { assets, assigned, repair, employees, licenses, utilization: assets ? Math.round((assigned / assets) * 1000) / 10 : 0 },
      })
    }
    return json({ companies: out })
  } catch (e) {
    return serverError(e)
  }
}
