import { db } from '@/lib/db'
import { json, serverError } from '@/lib/api-helpers'

/** Dashboard + report-page KPI aggregates, scoped by company code */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const code = url.searchParams.get('company') || 'ACME'
    const company = await db.company.findUnique({ where: { code } })
    if (!company) return json({ error: 'Company not found' }, 404)
    const companyId = company.id
    const now = new Date()
    const in60 = new Date(now.getTime() + 60 * 86400000)

    const [total, assigned, repair, retired, inStock, warrantyHw, licExpiring] = await Promise.all([
      db.asset.count({ where: { companyId } }),
      db.asset.count({ where: { companyId, status: 'ASSIGNED' } }),
      db.asset.count({ where: { companyId, status: 'REPAIR' } }),
      db.asset.count({ where: { companyId, status: 'RETIRED' } }),
      db.asset.count({ where: { companyId, status: 'IN_STOCK' } }),
      db.asset.count({ where: { companyId, warrantyEnd: { gte: now, lte: in60 } } }),
      db.softwareLicense.count({ where: { companyId, expiresAt: { gte: now, lte: in60 } } }),
    ])

    const byCategory = await db.asset.groupBy({
      by: ['category'], where: { companyId }, _count: { _all: true }, _sum: { purchaseCost: true },
    })

    // assignment trend over the last 6 months
    const trend: { month: string; assigned: number; returned: number }[] = []
    for (let i = 5; i >= 0; i--) {
      const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1))
      const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i + 1, 1))
      const [a, r] = await Promise.all([
        db.assignment.count({ where: { asset: { companyId }, issuedAt: { gte: start, lt: end } } }),
        db.returnRecord.count({ where: { assignment: { asset: { companyId } }, returnedAt: { gte: start, lt: end } } }),
      ])
      const label = start.toLocaleString('en-US', { month: 'short' })
      trend.push({ month: label, assigned: a, returned: r })
    }

    const [openRepairs, repairCost, employeesCount, vendorsCount, licensesCount] = await Promise.all([
      db.repairRecord.count({ where: { asset: { companyId }, status: { not: 'RESOLVED' } } }),
      db.repairRecord.aggregate({ where: { asset: { companyId } }, _sum: { repairCost: true } }),
      db.employee.count({ where: { companyId } }),
      db.vendor.count({ where: { companyId } }),
      db.softwareLicense.count({ where: { companyId } }),
    ])

    const recentAudit = await db.auditLog.findMany({ orderBy: { timestamp: 'desc' }, take: 8 })
    const auditCount = await db.auditLog.count()

    const expiringSoon = await db.asset.findMany({
      where: { companyId, warrantyEnd: { gte: now, lte: in60 } },
      orderBy: { warrantyEnd: 'asc' },
      take: 6,
      select: { assetTag: true, name: true, warrantyEnd: true, status: true },
    })

    return json({
      kpis: {
        total,
        assigned,
        repair,
        inStock,
        retired,
        utilization: total ? Math.trunc((assigned / total) * 1000) / 10 : 0,
        downtime: total ? Math.trunc((repair / total) * 1000) / 10 : 0,
        warrantyAlerts: warrantyHw + licExpiring,
        warrantyHw,
        licExpiring,
      },
      byCategory: byCategory.map((c) => ({ category: c.category, count: c._count._all, value: c._sum.purchaseCost ?? 0 })),
      trend,
      openRepairs,
      repairCost: repairCost._sum.repairCost ?? 0,
      employeesCount,
      vendorsCount,
      licensesCount,
      auditCount,
      recentAudit,
      expiringSoon,
    })
  } catch (e) {
    return serverError(e)
  }
}
