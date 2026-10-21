import { db } from '@/lib/db'
import { formatIST, HW_CATEGORIES } from '@/lib/api-helpers'

export type Cell = { text: string; tone?: 'asset' | 'green' | 'amber' | 'red' | 'blue' | 'mono' | 'muted' | 'strong' }
export type ReportSection = {
  key: string
  title: string
  headers: string[]
  rows: Cell[][]
  total: number
}

export const REPORT_CATEGORIES = [
  { key: 'inventory', num: 1, name: 'Current Inventory Master', badge: 'Core', desc: 'Master hardware list. Serial tags, condition, purchase costs & company ownership.' },
  { key: 'employee', num: 2, name: 'Employee Asset Statement', badge: 'Custody', desc: 'Comprehensive breakdown of all hardware & software keys issued per employee.' },
  { key: 'assignment', num: 3, name: 'Assignment Register', badge: 'Handover', desc: 'Signed handover receipts, issuance dates, expected return dates & signoffs.' },
  { key: 'transfer', num: 4, name: 'Transfer History Log', badge: 'Chain', desc: 'Inter-departmental and inter-company custody transfers and historical lineage.' },
  { key: 'repair', num: 5, name: 'Defective / Repair Register', badge: 'Maintenance', desc: 'RMA cases, vendor service tickets, repair costs, and downtime tracking.' },
  { key: 'expiry', num: 6, name: 'Expiry & Warranty Report', badge: 'Lifecycle', desc: 'Upcoming hardware warranty end dates and software license expiration timelines.' },
  { key: 'audit', num: 7, name: 'System Asset Audit Trail', badge: 'Security', desc: 'Immutable event history, administrative field changes, and operator stamps.' },
] as const

export type CategoryKey = (typeof REPORT_CATEGORIES)[number]['key']

const STATUS_TONE: Record<string, Cell['tone']> = {
  IN_STOCK: 'green', ASSIGNED: 'blue', REPAIR: 'red', RETIRED: 'muted',
  ACTIVE: 'green', RETURNED: 'muted', OPEN: 'red', IN_PROGRESS: 'amber', RESOLVED: 'green',
}

function d(value: Date | null | undefined): string {
  if (!value) return '—'
  const dt = new Date(value)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${dt.getUTCFullYear()}-${p(dt.getUTCMonth() + 1)}-${p(dt.getUTCDate())}`
}

export async function buildReport(opts: {
  category: string
  companyCode?: string | null
  filterA?: string | null // hardware category / department / assignment status / transfer type / case status / expiry window / event category
  filterB?: string | null // asset status / employee / issued window / period / vendor / item type / operator
  limit?: number
  offset?: number
  forExport?: boolean
}): Promise<ReportSection> {
  const companyCode = opts.companyCode || 'ACME'
  const company = await db.company.findUnique({ where: { code: companyCode } })
  const companyId = company?.id
  const limit = opts.limit ?? 5
  const offset = opts.offset ?? 0
  const take = opts.forExport ? 5000 : limit
  const skip = opts.forExport ? 0 : offset
  const fA = opts.filterA && opts.filterA !== 'ALL' ? opts.filterA : null
  const fB = opts.filterB && opts.filterB !== 'ALL' ? opts.filterB : null

  switch (opts.category) {
    case 'inventory': {
      const where = {
        companyId,
        ...(fA ? { category: fA } : {}),
        ...(fB ? { status: fB } : {}),
      }
      const [total, assets] = await Promise.all([
        db.asset.count({ where }),
        db.asset.findMany({
          where, orderBy: { createdAt: 'desc' }, skip, take,
          include: {
            assignments: { where: { status: 'ACTIVE' }, include: { employee: { select: { name: true } } } },
          },
        }),
      ])
      return {
        key: 'inventory',
        title: 'Current Inventory Master',
        headers: ['ASSET TAG', 'MODEL / SERIAL', 'CATEGORY', 'STATUS', 'CONDITION', 'ASSIGNED CUSTODIAN', 'PURCHASE COST'],
        rows: assets.map((a) => [
          { text: a.assetTag, tone: 'asset' },
          { text: `${a.name} · ${a.serialNumber ?? '—'}` },
          { text: a.category },
          { text: a.status.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase()), tone: STATUS_TONE[a.status] },
          { text: a.condition, tone: a.condition === 'Poor' ? 'red' : a.condition === 'Fair' ? 'amber' : 'green' },
          { text: a.assignments[0]?.employee?.name ?? 'Unassigned', tone: a.assignments[0] ? undefined : 'muted' },
          { text: '$' + a.purchaseCost.toLocaleString('en-US') },
        ]),
        total,
      }
    }

    case 'employee': {
      const emps = await db.employee.findMany({
        where: { companyId, ...(fA ? { department: fA } : {}), ...(fB ? { name: { contains: fB } } : {}) },
        orderBy: { name: 'asc' },
      })
      const ids = emps.map((e) => e.id)
      const asgGroups = await db.assignment.groupBy({
        by: ['employeeId'], where: { employeeId: { in: ids }, status: 'ACTIVE' }, _count: { _all: true },
      })
      const asgMap = new Map(asgGroups.map((g) => [g.employeeId, g._count._all]))
      const total = emps.length
      const page = emps.slice(skip, skip + take)
      const rows: Cell[][] = []
      for (const e of page) {
        const active = await db.assignment.findFirst({
          where: { employeeId: e.id, status: 'ACTIVE' },
          orderBy: { issuedAt: 'desc' },
          select: { issuedAt: true },
        })
        rows.push([
          { text: e.name, tone: 'strong' },
          { text: `${e.designation} · ${e.department}` },
          { text: e.empCode, tone: 'mono' },
          { text: String(asgMap.get(e.id) ?? 0) },
          { text: e.location ?? '—' },
          { text: active ? formatIST(active.issuedAt).replace(' IST', '') : '—', tone: active ? undefined : 'muted' },
        ])
      }
      return {
        key: 'employee',
        title: 'Employee Asset Statement',
        headers: ['EMPLOYEE', 'DESIGNATION / DEPARTMENT', 'EMPLOYEE ID', 'ASSETS HELD', 'LOCATION', 'LAST ISSUED (IST)'],
        rows, total,
      }
    }

    case 'assignment': {
      const where = {
        status: 'ACTIVE',
        asset: { companyId, ...(fA ? { category: fA } : {}) },
        ...(fB ? { employee: { department: fB } } : {}),
      }
      const [total, list] = await Promise.all([
        db.assignment.count({ where }),
        db.assignment.findMany({
          where, orderBy: { issuedAt: 'desc' }, skip, take,
          include: { asset: { select: { assetTag: true, name: true, category: true } }, employee: { select: { name: true, department: true } } },
        }),
      ])
      return {
        key: 'assignment',
        title: 'Assignment Register',
        headers: ['RECEIPT ID', 'ASSET TAG', 'ASSET', 'ISSUED TO', 'ISSUED ON (IST)', 'EXPECTED RETURN', 'SIGNOFF'],
        rows: list.map((a) => [
          { text: a.receiptId, tone: 'mono' },
          { text: a.asset.assetTag, tone: 'asset' },
          { text: a.asset.name },
          { text: `${a.employee.name} (${a.employee.department})` },
          { text: formatIST(a.issuedAt).replace(' IST', '') },
          { text: d(a.expectedReturnAt), tone: 'muted' },
          { text: a.signoffBy ?? 'Signed', tone: 'green' },
        ]),
        total,
      }
    }

    case 'transfer': {
      const where = {
        assignment: { asset: { companyId } },
        ...(fA ? { toDept: fA } : {}),
        ...(fB ? { operator: fB } : {}),
      }
      const [total, list] = await Promise.all([
        db.transferRecord.count({ where }),
        db.transferRecord.findMany({
          where, orderBy: { transferredAt: 'desc' }, skip, take,
          include: { assignment: { include: { asset: { select: { assetTag: true, name: true } } } } },
        }),
      ])
      return {
        key: 'transfer',
        title: 'Transfer History Log',
        headers: ['TRANSFER ID', 'ASSET TAG', 'FROM', 'TO', 'OPERATOR', 'DATE (IST)', 'CHAIN REF'],
        rows: list.map((t) => [
          { text: t.transferId, tone: 'mono' },
          { text: t.assignment.asset.assetTag, tone: 'asset' },
          { text: t.fromDept },
          { text: t.toDept, tone: 'blue' },
          { text: t.operator },
          { text: formatIST(t.transferredAt).replace(' IST', '') },
          { text: t.transferId.replace('TRF', 'CHN'), tone: 'mono' },
        ]),
        total,
      }
    }

    case 'repair': {
      const where = {
        asset: { companyId },
        ...(fA ? { status: fA } : {}),
        ...(fB ? { vendor: { name: fB } } : {}),
      }
      const [total, list] = await Promise.all([
        db.repairRecord.count({ where }),
        db.repairRecord.findMany({
          where, orderBy: { reportedAt: 'desc' }, skip, take,
          include: { asset: { select: { assetTag: true, name: true } }, vendor: { select: { name: true } } },
        }),
      ])
      return {
        key: 'repair',
        title: 'Defective / Repair Register',
        headers: ['RMA CASE', 'ASSET TAG', 'ISSUE', 'VENDOR', 'COST', 'DOWNTIME', 'STATUS'],
        rows: list.map((r) => [
          { text: r.rmaNumber, tone: 'mono' },
          { text: r.asset.assetTag, tone: 'asset' },
          { text: r.issue },
          { text: r.vendor?.name ?? '—' },
          { text: '$' + r.repairCost.toLocaleString('en-US') },
          { text: r.downtimeDays + ' days', tone: r.downtimeDays > 10 ? 'red' : 'muted' },
          { text: r.status.replace('_', ' '), tone: STATUS_TONE[r.status] },
        ]),
        total,
      }
    }

    case 'expiry': {
      const includeHardware = !fA || fA === 'ALL' || fA !== 'Software License'
      const includeSoftware = !fA || fA === 'ALL' || fA === 'Software License'
      const assets = includeHardware
        ? await db.asset.findMany({
            where: { companyId, warrantyEnd: { not: null }, ...(fA && fA !== 'ALL' && fA !== 'Software License' ? { category: fA } : {}) },
            include: { assignments: { where: { status: 'ACTIVE' }, include: { employee: { select: { name: true } } } } },
            orderBy: { warrantyEnd: 'asc' },
          })
        : []
      const licenses = includeSoftware
        ? await db.softwareLicense.findMany({ where: { companyId, expiresAt: { not: null } }, include: { vendor: { select: { name: true } } }, orderBy: { expiresAt: 'asc' } })
        : []
      type Item = { tag: string; type: string; vendor: string; purchased: Date | null; expires: Date; custodian: string }
      const items: Item[] = [
        ...assets.map((a) => ({ tag: a.assetTag, type: a.category, vendor: (a.name.split(' ')[0] ?? '—'), purchased: a.purchaseDate, expires: a.warrantyEnd as Date, custodian: a.assignments[0]?.employee?.name ?? 'Unassigned' })),
        ...licenses.map((l) => ({ tag: l.name, type: 'Software License', vendor: l.vendor?.name ?? '—', purchased: l.createdAt, expires: l.expiresAt as Date, custodian: l.seats + ' seats' })),
      ]
      items.sort((a, b) => a.expires.getTime() - b.expires.getTime())
      const now = Date.now()
      const window = fB === '30d' ? 30 : fB === '60d' ? 60 : fB === '90d' ? 90 : null
      const filtered = window ? items.filter((i) => i.expires.getTime() - now <= window * 86400000) : items
      const page = filtered.slice(skip, skip + take)
      return {
        key: 'expiry',
        title: 'Expiry & Warranty Report',
        headers: ['ITEM', 'TYPE', 'VENDOR / BRAND', 'CUSTODIAN / SEATS', 'EXPIRY DATE', 'DAYS LEFT'],
        rows: page.map((i) => {
          const days = Math.ceil((i.expires.getTime() - now) / 86400000)
          return [
            { text: i.tag, tone: i.type === 'Software License' ? 'strong' : 'asset' },
            { text: i.type },
            { text: i.vendor },
            { text: i.custodian },
            { text: d(i.expires), tone: days <= 30 ? 'red' : days <= 60 ? 'amber' : 'green' },
            { text: days <= 0 ? 'EXPIRED' : days + ' days', tone: days <= 30 ? 'red' : days <= 60 ? 'amber' : 'green' },
          ]
        }),
        total: filtered.length,
      }
    }

    case 'audit':
    default: {
      // Figma parameter panel: Company Scope | Hardware Category | Asset Status | Target Export Format
      // filterA = hardware category of the affected asset; filterB = asset-state event mapping
      const where: Record<string, unknown> = {}
      if (fA) {
        const tags = await db.asset.findMany({
          where: { category: fA, companyId },
          select: { assetTag: true },
        })
        where.affectedRecord = { in: tags.map((t) => t.assetTag) }
      }
      if (fB) {
        const map: Record<string, string> = {
          ASSIGNED: 'Asset Assignment',
          RETURNED: 'Asset Return',
          REPAIR: 'Repair Intake',
          CONFIG: 'System Config Edit',
          TRANSFER: 'Custody Transfer',
          REGISTRATION: 'Asset Registration',
        }
        if (map[fB]) where.category = map[fB]
      }
      const [total, list] = await Promise.all([
        db.auditLog.count({ where }),
        db.auditLog.findMany({ where, orderBy: { timestamp: 'desc' }, skip, take }),
      ])
      const rows = list.map((l) => [
        { text: formatIST(l.timestamp), tone: 'mono' as const },
        { text: l.category },
        { text: l.operator },
        { text: l.affectedRecord, tone: l.affectedRecord.startsWith('AST-') ? ('asset' as const) : ('strong' as const) },
        { text: l.actionDetails },
        { text: l.checksum, tone: 'green' as const },
      ])
      return {
        key: 'audit',
        title: 'System Asset Audit Trail',
        headers: ['EVENT TIMESTAMP', 'EVENT CATEGORY', 'OPERATOR', 'AFFECTED ASSET / RECORD', 'ACTION DETAILS / SUMMARY', 'SECURITY CHECKSUM'],
        rows, total,
      }
    }
  }
}

export { HW_CATEGORIES }
