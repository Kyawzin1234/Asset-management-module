/**
 * IT Asset Hub — Database Seed Script
 * Aligns ACME Corp scope exactly with the Figma prototype metrics:
 *  - Total registered assets: 1,482
 *  - Assigned / active statements: 1,240  (83.6% utilization)
 *  - Defective / under repair: 18         (1.2% downtime)
 *  - Warranty & expiry alerts: 14         (9 hardware + 5 software, within 60 days)
 *  - Audit trail records: 1,482
 */
import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

// Deterministic PRNG for stable seeds
let seedState = 42
function rand(): number {
  seedState = (seedState * 1103515245 + 12345) % 2147483648
  return seedState / 2147483648
}
function pick<T>(arr: T[]): T {
  return arr[Math.floor(rand() * arr.length)]
}
function randInt(min: number, max: number): number {
  return Math.floor(rand() * (max - min + 1)) + min
}
function checksum(): string {
  return '0x' + Math.floor(rand() * 0xffffff).toString(16).toUpperCase().padStart(6, '0')
}

const NOW = new Date('2026-10-21T10:00:00.000Z')

function daysFromNow(d: number): Date {
  return new Date(NOW.getTime() + d * 86400000)
}

const DEPARTMENTS = [
  'Engineering', 'Product Design', 'Finance', 'Human Resources', 'Sales',
  'Marketing', 'IT Operations', 'Legal', 'Customer Success', 'Operations',
]

const FIRST_NAMES = ['Elena', 'Sarah', 'David', 'Marcus', 'Priya', 'James', 'Aisha', 'Tom', 'Nina', 'Raj', 'Lucia', 'Omar', 'Grace', 'Viktor', 'Amara', 'Chen', 'Isabella', 'Noah', 'Fatima', 'Diego', 'Yuki', 'Hannah', 'Kwame', 'Ingrid', 'Arjun', 'Sofia', 'Liam', 'Zara', 'Ethan', 'Maya', 'Andrei', 'Carmen', 'Felix', 'Leila', 'Oscar', 'Ruth', 'Ivan', 'Anya', 'Hugo', 'Tara', 'Bruno', 'Selma', 'Kiran', 'Dana', 'Paul', 'Mira', 'Alex', 'Rosa', 'Sam', 'Elsa', 'Ravi', 'Lena', 'Marco', 'Ada', 'Jonas', 'Femi', 'Clara', 'Ben', 'Nadia', 'Theo']
const LAST_NAMES = ['Rostova', 'Jenkins', 'Miller', 'Chen', 'Sharma', 'Okafor', 'Kim', 'Novak', 'Silva', 'Patel', 'Nguyen', 'Weber', 'Costa', 'Haddad', 'Lindberg', 'Popov', 'Reyes', 'Osei', 'Kowalski', 'Tanaka', 'Rossi', 'Andersson', 'Dubois', 'Moreno', 'Ivanova', 'Fischer', 'Santos', 'Berg', 'Ali', 'Kaur', 'Lopez', 'Schmidt', 'Marino', 'Haas', 'Vargas', 'Petrov', 'Nilsen', 'Gomez', 'Bauer', 'Singh', 'Klein', 'Romano', 'Larsen', 'Moreau', 'Antonov', 'Meyer', 'Ortiz', 'Wagner', 'Suzuki', 'Baptiste', 'Aliyev', 'Fontaine', 'Ricci', 'Holm', 'Castillo', 'Dimitrov', 'Lehmann', 'Pereira', 'Sorensen', 'Vidal']

const ASSET_CATALOG: Record<string, { brands: string[]; models: string[]; cost: [number, number]; warrantyYears: number; cat3: string }> = {
  Laptop: { brands: ['Dell', 'Apple', 'HP', 'Lenovo'], models: ['XPS 15 9530', 'MacBook Pro 14" M3', 'EliteBook 840 G10', 'ThinkPad X1 Carbon'], cost: [1200, 3200], warrantyYears: 3, cat3: 'LAP' },
  Monitor: { brands: ['Dell', 'LG', 'Samsung'], models: ['UltraSharp U2723QE', '27GP850-B', 'S32D870', 'UltraSharp U3421WE'], cost: [250, 900], warrantyYears: 3, cat3: 'MON' },
  Phone: { brands: ['Apple', 'Samsung', 'Google'], models: ['iPhone 15 Pro', 'Galaxy S24 Ultra', 'Pixel 8 Pro'], cost: [700, 1300], warrantyYears: 2, cat3: 'PHN' },
  Tablet: { brands: ['Apple', 'Samsung'], models: ['iPad Pro 12.9"', 'Galaxy Tab S9 Ultra'], cost: [600, 1600], warrantyYears: 2, cat3: 'TAB' },
  Printer: { brands: ['HP', 'Canon', 'Epson'], models: ['LaserJet Pro M454', 'imageRUNNER 2630', 'WorkForce Pro WF-C5790'], cost: [300, 2500], warrantyYears: 2, cat3: 'PRN' },
  Server: { brands: ['Dell', 'HPE', 'Lenovo'], models: ['PowerEdge R750', 'ProLiant DL380 Gen10', 'ThinkSystem SR650'], cost: [4500, 14000], warrantyYears: 5, cat3: 'SRV' },
  Networking: { brands: ['Cisco', 'Ubiquiti', 'Aruba'], models: ['Catalyst 2960-X', 'UniFi Switch 48 PoE', 'Aruba 2930F'], cost: [400, 3800], warrantyYears: 3, cat3: 'NET' },
  Peripheral: { brands: ['Logitech', 'Keychron', 'Jabra'], models: ['MX Master 3S', 'K8 Pro', 'Evolve2 65'], cost: [60, 350], warrantyYears: 1, cat3: 'ACC' },
}

const CATEGORY_WEIGHTS: [string, number][] = [
  ['Laptop', 42], ['Monitor', 19], ['Phone', 11], ['Tablet', 7],
  ['Printer', 6], ['Server', 4], ['Networking', 5], ['Peripheral', 6],
]

const CONDITIONS = ['Excellent', 'Excellent', 'Excellent', 'Good', 'Good', 'Good', 'Fair', 'Poor']
const LOCATIONS = ['HQ — Mumbai', 'HQ — Bengaluru', 'Branch — Delhi', 'Branch — Pune', 'Warehouse — Chennai', 'Remote — Hybrid']

const REPAIR_ISSUES = [
  'Motherboard failure — no POST', 'Screen flicker / dead pixels cluster', 'Battery swelling — safety recall',
  'Keyboard deck flex & key failures', 'SSD read errors — SMART warnings', 'Liquid damage — unit will not power on',
  'Overheating under load — thermal shutdown', 'Hinge crack — chassis deformation', 'Wi-Fi card intermittent dropouts',
  'Port cluster failure — USB-C dead', 'Fan bearing noise — replacement', 'GPU artifacting under load',
]

const SOFTWARE_CATALOG = [
  { name: 'Adobe Creative Cloud', vendor: 'Adobe', type: 'Subscription', cost: 89 },
  { name: 'Microsoft 365 E3', vendor: 'Microsoft', type: 'Subscription', cost: 36 },
  { name: 'JetBrains All Products Pack', vendor: 'JetBrains', type: 'Subscription', cost: 28 },
  { name: 'Slack Enterprise Grid', vendor: 'Salesforce', type: 'Subscription', cost: 15 },
  { name: 'Figma Organization', vendor: 'Figma', type: 'Subscription', cost: 45 },
  { name: 'Atlassian Suite (Jira + Confluence)', vendor: 'Atlassian', type: 'Subscription', cost: 22 },
  { name: 'AutoCAD LT', vendor: 'Autodesk', type: 'Subscription', cost: 60 },
  { name: 'Windows 11 Pro OEM', vendor: 'Microsoft', type: 'OEM', cost: 199 },
  { name: 'Notion Plus', vendor: 'Notion', type: 'Subscription', cost: 12 },
  { name: 'Zoom Business', vendor: 'Zoom', type: 'Subscription', cost: 20 },
]

const VENDOR_CATALOG = [
  { name: 'Dell Technologies', category: 'Hardware', rating: 4.6 },
  { name: 'Apple Inc.', category: 'Hardware', rating: 4.8 },
  { name: 'HP Inc.', category: 'Hardware', rating: 4.2 },
  { name: 'Lenovo Group', category: 'Hardware', rating: 4.1 },
  { name: 'Cisco Systems', category: 'Hardware', rating: 4.5 },
  { name: 'Adobe Inc.', category: 'Software', rating: 4.3 },
  { name: 'Microsoft Corporation', category: 'Software', rating: 4.4 },
  { name: 'JetBrains s.r.o.', category: 'Software', rating: 4.7 },
  { name: 'Atlassian Corporation', category: 'Software', rating: 4.2 },
  { name: 'Figma Inc.', category: 'Software', rating: 4.8 },
  { name: 'ServicePoint Solutions', category: 'Service', rating: 3.9 },
  { name: 'TechRepair Global', category: 'Service', rating: 4.0 },
]

function pad(n: number, len: number): string {
  return String(n).padStart(len, '0')
}

async function main() {
  console.log('Clearing existing data...')
  await db.auditLog.deleteMany()
  await db.dispatchSchedule.deleteMany()
  await db.returnRecord.deleteMany()
  await db.transferRecord.deleteMany()
  await db.assignment.deleteMany()
  await db.repairRecord.deleteMany()
  await db.softwareLicense.deleteMany()
  await db.asset.deleteMany()
  await db.employee.deleteMany()
  await db.vendor.deleteMany()
  await db.company.deleteMany()

  console.log('Creating companies...')
  const acme = await db.company.create({
    data: { code: 'ACME', name: 'Acme Corp Ltd', industry: 'Manufacturing & Retail', location: 'Mumbai, India' },
  })
  const globex = await db.company.create({
    data: { code: 'GLBX', name: 'Globex Industries', industry: 'Heavy Engineering', location: 'Pune, India' },
  })
  const init = await db.company.create({
    data: { code: 'INIT', name: 'Initech Systems', industry: 'Software Services', location: 'Bengaluru, India' },
  })

  console.log('Creating vendors...')
  const acmeVendors = await Promise.all(
    VENDOR_CATALOG.map((v) =>
      db.vendor.create({
        data: {
          name: v.name, category: v.category, rating: v.rating, companyId: acme.id,
          contact: pick(FIRST_NAMES) + ' ' + pick(LAST_NAMES),
          email: 'partner@' + v.name.toLowerCase().replace(/[^a-z]+/g, '') + '.com',
          phone: '+91 22 ' + randInt(4000, 9999) + ' ' + randInt(1000, 9999),
          address: pick(['Andheri East', 'Powai', 'BKC', 'Lower Parel']) + ', Mumbai',
        },
      })
    )
  )
  await Promise.all(
    VENDOR_CATALOG.slice(0, 6).map((v) =>
      db.vendor.create({
        data: {
          name: v.name, category: v.category, rating: v.rating, companyId: globex.id,
          email: 'partner@' + v.name.toLowerCase().replace(/[^a-z]+/g, '') + '.com',
        },
      })
    )
  )
  await Promise.all(
    VENDOR_CATALOG.slice(3, 9).map((v) =>
      db.vendor.create({
        data: {
          name: v.name, category: v.category, rating: v.rating, companyId: init.id,
          email: 'partner@' + v.name.toLowerCase().replace(/[^a-z]+/g, '') + '.com',
        },
      })
    )
  )

  console.log('Creating employees...')
  async function createEmployees(companyId: string, companyCode: string, count: number, startIdx: number) {
    const emps: { id: string; name: string; department: string }[] = []
    for (let i = 0; i < count; i++) {
      const name = FIRST_NAMES[(startIdx + i) % FIRST_NAMES.length] + ' ' + LAST_NAMES[(startIdx * 2 + i) % LAST_NAMES.length]
      const emp = await db.employee.create({
        data: {
          empCode: `EMP-${companyCode}-${pad(startIdx + i, 4)}`,
          name,
          email: name.toLowerCase().replace(/\s+/g, '.') + '.' + (startIdx + i) + '@' + companyCode.toLowerCase() + '.com',
          department: DEPARTMENTS[(startIdx + i) % DEPARTMENTS.length],
          designation: pick(['Software Engineer', 'Senior Engineer', 'Product Designer', 'Finance Analyst', 'HR Business Partner', 'Account Executive', 'Marketing Lead', 'IT Support Specialist', 'Legal Counsel', 'Success Manager', 'Operations Lead', 'Engineering Manager']),
          location: pick(LOCATIONS),
          phone: '+91 9' + randInt(100000000, 999999999),
          companyId,
        },
      })
      emps.push({ id: emp.id, name: emp.name, department: emp.department })
    }
    return emps
  }
  const acmeEmployees = await createEmployees(acme.id, 'ACME', 64, 1)
  const globexEmployees = await createEmployees(globex.id, 'GLBX', 24, 200)
  const initEmployees = await createEmployees(init.id, 'INIT', 18, 400)

  // Guarantee the personas visible in the Figma audit trail
  const elena = await db.employee.create({
    data: {
      empCode: 'EMP-ACME-9001', name: 'Elena Rostova',
      email: 'elena.rostova@acme.com', department: 'Product Design',
      designation: 'Principal Product Designer', location: 'HQ — Mumbai',
      phone: '+91 98200 41182', companyId: acme.id,
    },
  })
  await db.employee.create({
    data: {
      empCode: 'EMP-ACME-9002', name: 'Sarah Jenkins',
      email: 'sarah.jenkins@acme.com', department: 'IT Operations',
      designation: 'IT Asset Manager', location: 'HQ — Mumbai',
      phone: '+91 98200 44510', companyId: acme.id,
    },
  })
  await db.employee.create({
    data: {
      empCode: 'EMP-ACME-9003', name: 'David Miller',
      email: 'david.miller@acme.com', department: 'IT Operations',
      designation: 'Systems Administrator', location: 'HQ — Mumbai',
      phone: '+91 98200 43290', companyId: acme.id,
    },
  })
  acmeEmployees.push({ id: elena.id, name: elena.name, department: elena.department })

  console.log('Creating ACME assets (1,482)...')

  function weightedCategory(): string {
    const total = CATEGORY_WEIGHTS.reduce((s, c) => s + c[1], 0)
    let r = rand() * total
    for (const [cat, w] of CATEGORY_WEIGHTS) {
      r -= w
      if (r <= 0) return cat
    }
    return 'Laptop'
  }

  const hwAlertIdx = new Set<number>()
  while (hwAlertIdx.size < 9) hwAlertIdx.add(randInt(0, 1481))
  const repairIdx = new Set<number>()
  while (repairIdx.size < 18) repairIdx.add(randInt(0, 1481))
  const retiredCount = 24
  const instockCount = 1482 - 1240 - 18 - retiredCount // 200

  type AssetSeed = {
    assetTag: string; name: string; category: string; serialNumber: string
    status: string; condition: string; purchaseCost: number; purchaseDate: Date
    warrantyEnd: Date; location: string; companyId: string
  }
  const acmeAssets: AssetSeed[] = []
  const seqByCatYear: Record<string, number> = {}
  for (let i = 0; i < 1482; i++) {
    const category = weightedCategory()
    const spec = ASSET_CATALOG[category]
    const purchaseDate = new Date(NOW.getTime() - randInt(30, 1150) * 86400000)
    const year = purchaseDate.getFullYear() % 100
    const key = category + year
    seqByCatYear[key] = (seqByCatYear[key] || 0) + 1
    const assetTag = `AST-ACME-${spec.cat3}-${pad(year, 2)}-${pad(seqByCatYear[key], 5)}`
    const warrantyEnd = new Date(purchaseDate.getTime() + spec.warrantyYears * 365 * 86400000)
    let status: string
    if (i < 1240) status = 'ASSIGNED'
    else if (i < 1258) status = 'REPAIR'
    else if (i < 1258 + instockCount) status = 'IN_STOCK'
    else status = 'RETIRED'
    if (hwAlertIdx.has(i) && status === 'RETIRED') status = 'IN_STOCK'
    acmeAssets.push({
      assetTag,
      name: `${spec.brands[randInt(0, spec.brands.length - 1)]} ${spec.models[randInt(0, spec.models.length - 1)]}`,
      category, serialNumber: 'SN' + randInt(100000, 999999) + 'XX',
      status,
      condition: status === 'RETIRED' ? 'Poor' : CONDITIONS[randInt(0, CONDITIONS.length - 1)],
      purchaseCost: randInt(spec.cost[0], spec.cost[1]),
      purchaseDate, warrantyEnd,
      location: pick(LOCATIONS),
      companyId: acme.id,
    })
  }
  // Force the flagship asset from the Figma design
  acmeAssets[0] = {
    assetTag: 'AST-ACME-LAP-26-00418', name: 'Dell XPS 15 9530', category: 'Laptop',
    serialNumber: 'SN482911XX', status: 'ASSIGNED', condition: 'Excellent',
    purchaseCost: 2450, purchaseDate: new Date('2026-01-12T00:00:00.000Z'),
    warrantyEnd: new Date('2029-01-12T00:00:00.000Z'), location: 'HQ — Mumbai', companyId: acme.id,
  }
  // Make sure the 9 hardware warranty alerts actually fall in the next 60 days
  for (const i of hwAlertIdx) {
    if (acmeAssets[i].status === 'RETIRED') continue
    acmeAssets[i].warrantyEnd = daysFromNow(randInt(5, 58))
  }
  // Push all OTHER assets out of the 60-day alert window so alerts stay at exactly 9 hw
  for (let i = 0; i < acmeAssets.length; i++) {
    if (hwAlertIdx.has(i)) continue
    const we = acmeAssets[i].warrantyEnd.getTime()
    const nowMs = NOW.getTime()
    if (we > nowMs && we <= nowMs + 60 * 86400000) {
      acmeAssets[i].warrantyEnd = new Date(nowMs + (70 + randInt(0, 400)) * 86400000)
    }
  }

  const createdAssets: { id: string; assetTag: string; category: string; status: string }[] = []
  const BATCH = 300
  for (let s = 0; s < acmeAssets.length; s += BATCH) {
    const slice = acmeAssets.slice(s, s + BATCH)
    await db.asset.createMany({ data: slice })
    const found = await db.asset.findMany({
      where: { companyId: acme.id, assetTag: { in: slice.map((a) => a.assetTag) } },
      select: { id: true, assetTag: true, category: true, status: true },
    })
    createdAssets.push(...found)
  }
  // brand field fill (name prefix)
  await db.$executeRawUnsafe(`UPDATE Asset SET brand = substr(name, 1, instr(name, ' ') - 1) WHERE companyId = '${acme.id}'`)

  // assets for other companies
  async function createCompanyAssets(companyId: string, code: string, count: number, assignedRatio: number) {
    const out: { id: string; assetTag: string; category: string; status: string }[] = []
    for (let i = 0; i < count; i++) {
      const category = weightedCategory()
      const spec = ASSET_CATALOG[category]
      const purchaseDate = new Date(NOW.getTime() - randInt(60, 1000) * 86400000)
      const year = purchaseDate.getFullYear() % 100
      const key = category + year + code
      seqByCatYear[key] = (seqByCatYear[key] || 0) + 1
      const status = rand() < assignedRatio ? 'ASSIGNED' : rand() < 0.5 ? 'IN_STOCK' : 'REPAIR'
      const a = await db.asset.create({
        data: {
          assetTag: `AST-${code}-${spec.cat3}-${pad(year, 2)}-${pad(seqByCatYear[key], 5)}`,
          name: `${spec.brands[randInt(0, spec.brands.length - 1)]} ${spec.models[randInt(0, spec.models.length - 1)]}`,
          category, brand: spec.brands[0], serialNumber: 'SN' + randInt(100000, 999999) + 'XX',
          status, condition: CONDITIONS[randInt(0, CONDITIONS.length - 1)],
          purchaseCost: randInt(spec.cost[0], spec.cost[1]), purchaseDate, warrantyEnd: new Date(purchaseDate.getTime() + spec.warrantyYears * 365 * 86400000),
          location: pick(LOCATIONS), companyId,
        },
      })
      out.push({ id: a.id, assetTag: a.assetTag, category: a.category, status: a.status })
    }
    return out
  }
  const globexAssets = await createCompanyAssets(globex.id, 'GLBX', 146, 0.7)
  const initAssets = await createCompanyAssets(init.id, 'INIT', 92, 0.65)

  console.log('Creating assignments...')
  const assignedAcme = createdAssets.filter((a) => a.status === 'ASSIGNED')
  const assignmentValues: {
    receiptId: string; assetId: string; employeeId: string; issuedAt: Date
    expectedReturnAt: Date; status: string; signoffBy: string; notes: string
  }[] = []
  let asgSeq = 1
  for (const a of assignedAcme) {
    const emp = a.assetTag === 'AST-ACME-LAP-26-00418' ? { id: elena.id, name: 'Elena Rostova', department: 'Product Design' } : pick(acmeEmployees)
    const issuedAt = new Date(NOW.getTime() - randInt(3, 300) * 86400000 - randInt(0, 20) * 3600000)
    assignmentValues.push({
      receiptId: `ASG-2026-${pad(asgSeq++, 5)}`,
      assetId: a.id, employeeId: emp.id, issuedAt,
      expectedReturnAt: new Date(issuedAt.getTime() + randInt(365, 730) * 86400000),
      status: 'ACTIVE', signoffBy: 'Sarah Jenkins', notes: 'Signed handover receipt on file.',
    })
  }
  for (let s = 0; s < assignmentValues.length; s += 250) {
    await db.assignment.createMany({ data: assignmentValues.slice(s, s + 250) })
  }
  const acmeAssignmentRows = await db.assignment.findMany({
    where: { status: 'ACTIVE', asset: { companyId: acme.id } },
    select: { id: true, assetId: true, receiptId: true },
  })

  async function assignCompany(list: { id: string; assetTag: string; category: string; status: string }[], employees: { id: string; name: string; department: string }[], startSeq: number) {
    let seq = startSeq
    for (const a of list.filter((x) => x.status === 'ASSIGNED')) {
      if (!employees.length) break
      const emp = pick(employees)
      const issuedAt = new Date(NOW.getTime() - randInt(10, 280) * 86400000)
      await db.assignment.create({
        data: {
          receiptId: `ASG-2026-${pad(seq++, 5)}`, assetId: a.id, employeeId: emp.id,
          issuedAt, expectedReturnAt: new Date(issuedAt.getTime() + randInt(365, 730) * 86400000),
          status: 'ACTIVE', signoffBy: 'IT Operations', notes: 'Signed handover receipt on file.',
        },
      })
    }
  }
  await assignCompany(globexAssets, globexEmployees, 50000)
  await assignCompany(initAssets, initEmployees, 60000)

  console.log('Creating returns / transfers / repairs...')
  const returnedPlan = 60
  const returnValues: {
    returnId: string; assignmentId: string; returnedAt: Date; condition: string
    reason: string; processedBy: string
  }[] = []
  const usedAssetsForReturn = new Set<string>()
  let retSeq = 1
  const candidates = [...acmeAssignmentRows]
  for (let i = 0; i < returnedPlan && candidates.length; i++) {
    const idx = randInt(0, candidates.length - 1)
    const row = candidates.splice(idx, 1)[0]
    if (usedAssetsForReturn.has(row.assetId)) continue
    usedAssetsForReturn.add(row.assetId)
    const returnedAt = new Date(NOW.getTime() - randInt(1, 120) * 86400000)
    returnValues.push({
      returnId: `RET-2026-${pad(retSeq++, 5)}`, assignmentId: row.id, returnedAt,
      condition: pick(['Excellent', 'Good', 'Good', 'Fair']), reason: pick(['Upgrade Cycle', 'Project Closure', 'Role Change', 'Resignation', 'Routine Swap']),
      processedBy: pick(['Sarah Jenkins', 'David Miller']),
    })
  }
  await db.returnRecord.createMany({ data: returnValues })

  const transferValues: {
    transferId: string; assignmentId: string; fromDept: string; toDept: string
    fromCompany: string; toCompany: string; transferredAt: Date; operator: string; reason: string
  }[] = []
  let trfSeq = 1
  const trfCandidates = [...acmeAssignmentRows]
  for (let i = 0; i < 42 && trfCandidates.length; i++) {
    const row = trfCandidates[randInt(0, trfCandidates.length - 1)]
    if (usedAssetsForReturn.has(row.assetId)) continue
    usedAssetsForReturn.add(row.assetId)
    const fromDept = pick(DEPARTMENTS)
    let toDept = pick(DEPARTMENTS)
    while (toDept === fromDept) toDept = pick(DEPARTMENTS)
    transferValues.push({
      transferId: `TRF-2026-${pad(trfSeq++, 5)}`, assignmentId: row.id,
      fromDept, toDept, fromCompany: 'Acme Corp Ltd', toCompany: 'Acme Corp Ltd',
      transferredAt: new Date(NOW.getTime() - randInt(1, 150) * 86400000),
      operator: pick(['Sarah Jenkins', 'David Miller']),
      reason: pick(['Inter-departmental project move', 'Team restructure', 'Dedicated project requirement', 'Budget reallocation']),
    })
  }
  await db.transferRecord.createMany({ data: transferValues })

  const repairAssets = createdAssets.filter((a) => a.status === 'REPAIR')
  for (let i = 0; i < repairAssets.length; i++) {
    const a = repairAssets[i]
    const hwVendors = acmeVendors.filter((v) => v.category === 'Hardware')
    const svcVendors = acmeVendors.filter((v) => v.category === 'Service')
    const vendor = pick(hwVendors.concat(svcVendors))
    await db.repairRecord.create({
      data: {
        rmaNumber: `RMA-2026-${pad(i + 1, 4)}`, assetId: a.id, vendorId: vendor.id,
        issue: pick(REPAIR_ISSUES), reportedAt: new Date(NOW.getTime() - randInt(2, 60) * 86400000),
        repairCost: randInt(80, 1400), downtimeDays: randInt(1, 21),
        status: pick(['OPEN', 'IN_PROGRESS', 'IN_PROGRESS', 'RESOLVED']),
        ticketNo: 'TCK-' + randInt(100000, 999999),
      },
    })
  }

  console.log('Creating software licenses...')
  const licenseValues: {
    name: string; vendorId: string | null; licenseKey: string; seats: number; seatsUsed: number
    type: string; expiresAt: Date; costPerSeat: number; companyId: string
  }[] = []
  const expiringLicenses = 5
  for (let i = 0; i < 22; i++) {
    const sw = SOFTWARE_CATALOG[i % SOFTWARE_CATALOG.length]
    const vendor = acmeVendors.find((v) => v.name.toLowerCase().includes(sw.vendor.toLowerCase().slice(0, 4)))
    const seats = randInt(25, 480)
    let expiresAt = new Date(NOW.getTime() + randInt(70, 540) * 86400000)
    if (i < expiringLicenses) expiresAt = daysFromNow(randInt(4, 55))
    licenseValues.push({
      name: sw.name, vendorId: vendor ? vendor.id : null,
      licenseKey: 'LIC-' + randInt(1000, 9999) + '-' + randInt(1000, 9999) + '-' + randInt(1000, 9999),
      seats, seatsUsed: Math.floor(seats * (0.4 + rand() * 0.55)),
      type: sw.type, expiresAt, costPerSeat: sw.cost, companyId: acme.id,
    })
  }
  await db.softwareLicense.createMany({ data: licenseValues })

  console.log('Creating audit trail (1,482 records)...')
  const IST_OFFSET = 5.5 * 60 * 60 * 1000
  // 2026-10-19 14:45:10 IST == 09:15:10Z ; 2026-10-18 11:28:04 IST == 05:58:04Z
  const flagship = [
    {
      timestamp: new Date(new Date('2026-10-19T14:45:10.000Z').getTime() - IST_OFFSET),
      category: 'Asset Assignment', operator: 'Sarah Jenkins',
      affectedRecord: 'AST-ACME-LAP-26-00418',
      actionDetails: 'Assigned custody to Elena Rostova (Product Design)',
      checksum: '0x9F82A1', severity: 'INFO',
    },
    {
      timestamp: new Date(new Date('2026-10-18T11:28:04.000Z').getTime() - IST_OFFSET),
      category: 'System Config Edit', operator: 'David Miller',
      affectedRecord: 'ID Rule Syntax',
      actionDetails: 'Updated global Asset Tag format rule prefix and separators',
      checksum: '0x4C3B89', severity: 'WARNING',
    },
  ]
  const auditValues: {
    timestamp: Date; category: string; operator: string; affectedRecord: string
    actionDetails: string; checksum: string; severity: string
  }[] = []
  const targetAuditCount = 1482
  const mix: [string, number][] = [
    ['Asset Return', 60], ['Custody Transfer', 42],
    ['Asset Registration', 60], ['System Config Edit', 64], ['Repair Intake', 18],
  ]
  const fixedTotal = mix.reduce((s, m) => s + m[1], 0) + 2
  const assignAuditCount = targetAuditCount - fixedTotal
  // generated rows start just BELOW the second flagship event so the stream
  // opens with the two flagship rows exactly like the Figma prototype
  let tsCounter = new Date('2026-10-18T11:28:04.000Z').getTime() - IST_OFFSET - 1000
  for (let i = 0; i < assignAuditCount; i++) {
    const a = pick(createdAssets)
    const e = pick(acmeEmployees)
    tsCounter -= randInt(120, 2400) * 1000
    auditValues.push({
      timestamp: new Date(tsCounter), category: 'Asset Assignment', operator: pick(['Sarah Jenkins', 'David Miller', 'System Scheduler', 'Priya Sharma']),
      affectedRecord: a.assetTag, actionDetails: `Assigned custody to ${e.name} (${e.department})`, checksum: checksum(), severity: 'INFO',
    })
  }
  for (const [cat, n] of mix) {
    for (let i = 0; i < n; i++) {
      let affected = ''
      let details = ''
      switch (cat) {
        case 'Asset Return': {
          const a = pick(createdAssets)
          affected = a.assetTag
          details = `Custody returned by ${pick(acmeEmployees).name} — condition verified & restocked`
          break
        }
        case 'Custody Transfer': {
          const a = pick(createdAssets)
          const d1 = pick(DEPARTMENTS)
          let d2 = pick(DEPARTMENTS)
          while (d2 === d1) d2 = pick(DEPARTMENTS)
          affected = a.assetTag
          details = `Custody transferred ${d1} → ${d2}, chain-of-custody re-signed`
          break
        }
        case 'Asset Registration': {
          const a = pick(createdAssets)
          affected = a.assetTag
          details = 'Asset registered to master inventory with serial verification'
          break
        }
        case 'System Config Edit': {
          affected = pick(['ID Rule Syntax', 'Export Template: PDF Statement', 'Retention Policy', 'Scope Defaults', 'Category Schema', 'Checksum Algorithm'])
          details = pick([
            'Updated global Asset Tag format rule prefix and separators',
            'Modified PDF statement footer & compliance disclaimer block',
            'Adjusted audit retention window from 24 to 36 months',
            'Changed default company scope binding for new records',
            'Reordered hardware category taxonomy and badge mapping',
            'Rotated stream checksum salt for security hardening',
          ])
          break
        }
        case 'Repair Intake': {
          const a = pick(createdAssets)
          affected = a.assetTag
          details = 'RMA case opened with vendor service desk — unit flagged under repair'
          break
        }
      }
      tsCounter -= randInt(120, 2400) * 1000
      auditValues.push({
        timestamp: new Date(tsCounter), category: cat, operator: pick(['Sarah Jenkins', 'David Miller', 'System Scheduler', 'Priya Sharma']),
        affectedRecord: affected, actionDetails: details, checksum: checksum(),
        severity: cat === 'System Config Edit' ? pick(['INFO', 'WARNING']) : 'INFO',
      })
    }
  }
  await db.auditLog.createMany({ data: [...flagship, ...auditValues] })

  console.log('Creating dispatch schedule...')
  await db.dispatchSchedule.create({
    data: {
      frequency: 'Monthly (1st Day 09:00 AM)',
      recipients: 'compliance@acme.com, dept-leads@acme.com',
      formats: 'PDF, Excel',
      isActive: true,
    },
  })

  const finalCounts = {
    companies: await db.company.count(),
    employees: await db.employee.count(),
    assets: await db.asset.count(),
    acmeAssets: await db.asset.count({ where: { companyId: acme.id } }),
    acmeAssigned: await db.asset.count({ where: { companyId: acme.id, status: 'ASSIGNED' } }),
    acmeRepair: await db.asset.count({ where: { companyId: acme.id, status: 'REPAIR' } }),
    assignments: await db.assignment.count(),
    returns: await db.returnRecord.count(),
    transfers: await db.transferRecord.count(),
    repairs: await db.repairRecord.count(),
    licenses: await db.softwareLicense.count(),
    vendors: await db.vendor.count(),
    audit: await db.auditLog.count(),
  }
  console.log('SEED COMPLETE', JSON.stringify(finalCounts, null, 2))
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => db.$disconnect())
