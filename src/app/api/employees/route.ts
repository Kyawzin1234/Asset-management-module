import { db } from '@/lib/db'
import { json, badRequest, serverError } from '@/lib/api-helpers'

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const code = url.searchParams.get('company') || 'ACME'
    const q = url.searchParams.get('q') || ''
    const department = url.searchParams.get('department') || 'ALL'
    const company = await db.company.findUnique({ where: { code } })
    if (!company) return badRequest('Unknown company scope')
    const where = {
      companyId: company.id,
      ...(department !== 'ALL' ? { department } : {}),
      ...(q ? { OR: [{ name: { contains: q } }, { empCode: { contains: q } }, { email: { contains: q } }] } : {}),
    }
    const [total, list] = await Promise.all([
      db.employee.count({ where }),
      db.employee.findMany({
        where,
        orderBy: { createdAt: 'asc' },
        include: { _count: { select: { assignments: { where: { status: 'ACTIVE' } } } } },
      }),
    ])
    const departments = await db.employee.findMany({
      where: { companyId: company.id },
      select: { department: true },
      distinct: ['department'],
    })
    return json({ employees: list, total, departments: departments.map((d) => d.department) })
  } catch (e) {
    return serverError(e)
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const company = await db.company.findUnique({ where: { code: body.company || 'ACME' } })
    if (!company) return badRequest('Unknown company scope')
    if (!body.name || !body.department) return badRequest('Name and department are required')
    const count = await db.employee.count({ where: { companyId: company.id } })
    const emp = await db.employee.create({
      data: {
        empCode: `EMP-${company.code}-${String(count + 1000).padStart(4, '0')}`,
        name: body.name,
        email: body.email || body.name.toLowerCase().replace(/\s+/g, '.') + '.' + Date.now() % 10000 + '@' + company.code.toLowerCase() + '.com',
        department: body.department,
        designation: body.designation || 'Team Member',
        location: body.location || 'HQ — Mumbai',
        companyId: company.id,
      },
    })
    return json({ employee: emp })
  } catch {
    return badRequest('Unable to create employee — email may already exist')
  }
}
