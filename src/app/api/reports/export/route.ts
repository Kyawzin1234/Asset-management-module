import { buildReport, REPORT_CATEGORIES } from '@/lib/reports'
import { toCSV, toExcelXML } from '@/lib/api-helpers'

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const category = url.searchParams.get('category') || 'audit'
    const company = url.searchParams.get('company') || 'ACME'
    const filterA = url.searchParams.get('filterA') || 'ALL'
    const filterB = url.searchParams.get('filterB') || 'ALL'
    const format = url.searchParams.get('format') || 'csv'

    const section = await buildReport({
      category, companyCode: company, filterA, filterB, forExport: true,
    })
    const cat = REPORT_CATEGORIES.find((c) => c.key === category)
    const fileBase = (cat?.name ?? 'Report').replace(/[^a-zA-Z0-9]+/g, '_')
    const stamp = new Date().toISOString().slice(0, 10)
    const flatRows = section.rows.map((r) => r.map((c) => c.text))

    if (format === 'xls') {
      const xml = toExcelXML(section.title, section.headers, flatRows)
      return new Response(xml, {
        headers: {
          'Content-Type': 'application/vnd.ms-excel',
          'Content-Disposition': `attachment; filename="${fileBase}_${stamp}.xls"`,
        },
      })
    }
    if (format === 'json') {
      // full data payload for client-side PDF (print) rendering
      return Response.json({ title: section.title, headers: section.headers, rows: flatRows, total: section.total, company })
    }
    const csv = toCSV(section.headers, flatRows)
    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${fileBase}_${stamp}.csv"`,
      },
    })
  } catch (e) {
    console.error('[export]', e)
    return Response.json({ error: 'Export failed' }, { status: 500 })
  }
}
