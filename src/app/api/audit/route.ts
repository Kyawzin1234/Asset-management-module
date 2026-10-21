import { db } from '@/lib/db'
import { json, serverError } from '@/lib/api-helpers'

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const category = url.searchParams.get('category') || 'ALL'
    const q = url.searchParams.get('q') || ''
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') || '50')))
    const where = {
      ...(category !== 'ALL' ? { category } : {}),
      ...(q ? { OR: [{ affectedRecord: { contains: q } }, { actionDetails: { contains: q } }, { operator: { contains: q } }] } : {}),
    }
    const [total, list, categories] = await Promise.all([
      db.auditLog.count({ where }),
      db.auditLog.findMany({ where, orderBy: { timestamp: 'desc' }, take: limit }),
      db.auditLog.findMany({ select: { category: true }, distinct: ['category'] }),
    ])
    return json({ logs: list, total, categories: categories.map((c) => c.category) })
  } catch (e) {
    return serverError(e)
  }
}
