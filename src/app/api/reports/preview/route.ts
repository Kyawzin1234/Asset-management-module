import { json, serverError } from '@/lib/api-helpers'
import { buildReport } from '@/lib/reports'

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const category = url.searchParams.get('category') || 'audit'
    const company = url.searchParams.get('company') || 'ACME'
    const filterA = url.searchParams.get('filterA') || 'ALL'
    const filterB = url.searchParams.get('filterB') || 'ALL'
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'))
    const pageSize = Math.max(5, parseInt(url.searchParams.get('pageSize') || '5'))
    const section = await buildReport({
      category, companyCode: company, filterA, filterB,
      limit: pageSize, offset: (page - 1) * pageSize,
    })
    return json({ ...section, page, pageSize, refreshedAt: new Date().toISOString() })
  } catch (e) {
    return serverError(e)
  }
}
