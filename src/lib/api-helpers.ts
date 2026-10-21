import { db } from '@/lib/db'

export function json(data: unknown, status = 200) {
  return Response.json(data, { status })
}

export function badRequest(msg: string) {
  return Response.json({ error: msg }, { status: 400 })
}

export function serverError(e: unknown) {
  console.error('[API Error]', e)
  return Response.json({ error: 'Internal server error' }, { status: 500 })
}

/** Resolve company by code (scope), defaults to ACME */
export async function resolveCompany(code?: string | null) {
  if (!code) return null
  return db.company.findUnique({ where: { code } })
}

/** Format a date to IST "2026-10-19 14:45:10 IST" */
export function formatIST(d: Date | string): string {
  const date = typeof d === 'string' ? new Date(d) : d
  const ist = new Date(date.getTime() + 5.5 * 3600 * 1000)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${ist.getUTCFullYear()}-${p(ist.getUTCMonth() + 1)}-${p(ist.getUTCDate())} ${p(ist.getUTCHours())}:${p(ist.getUTCMinutes())}:${p(ist.getUTCSeconds())} IST`
}

/** Short human date like "Oct 19, 2026 • 15:26 IST" */
export function formatISTShort(d: Date | string): string {
  const date = typeof d === 'string' ? new Date(d) : d
  const ist = new Date(date.getTime() + 5.5 * 3600 * 1000)
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const p = (n: number) => String(n).padStart(2, '0')
  return `${months[ist.getUTCMonth()]} ${ist.getUTCDate()}, ${ist.getUTCFullYear()} • ${p(ist.getUTCHours())}:${p(ist.getUTCMinutes())} IST`
}

/** Generate a pseudo security checksum like 0x9F82A1 */
export function checksum(): string {
  return '0x' + Math.floor(Math.random() * 0xffffff).toString(16).toUpperCase().padStart(6, '0')
}

/** Write an immutable audit trail entry */
export async function audit(opts: {
  category: string
  operator?: string
  affectedRecord: string
  actionDetails: string
  severity?: string
}) {
  await db.auditLog.create({
    data: {
      category: opts.category,
      operator: opts.operator ?? 'Sarah Jenkins',
      affectedRecord: opts.affectedRecord,
      actionDetails: opts.actionDetails,
      checksum: checksum(),
      severity: opts.severity ?? 'INFO',
    },
  })
}

export function csvEscape(v: unknown): string {
  const s = String(v ?? '')
  if (/[",\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"'
  return s
}

export function toCSV(headers: string[], rows: (string | number)[][]): string {
  const lines = [headers.map(csvEscape).join(',')]
  for (const r of rows) lines.push(r.map(csvEscape).join(','))
  return '\uFEFF' + lines.join('\n')
}

/** Excel 2003 SpreadsheetML — opens natively in Excel with typed columns */
export function toExcelXML(sheetName: string, headers: string[], rows: (string | number)[][]): string {
  const esc = (s: unknown) =>
    String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const cell = (v: string | number) => {
    if (typeof v === 'number' && isFinite(v))
      return `<Cell><Data ss:Type="Number">${v}</Data></Cell>`
    return `<Cell><Data ss:Type="String">${esc(v)}</Data></Cell>`
  }
  const headerRow = `<Row>${headers.map((h) => `<Cell ss:StyleID="hdr"><Data ss:Type="String">${esc(h)}</Data></Cell>`).join('')}</Row>`
  const bodyRows = rows.map((r) => `<Row>${r.map(cell).join('')}</Row>`).join('\n')
  return `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Styles>
  <Style ss:ID="hdr">
   <Font ss:Bold="1" ss:Color="#FFFFFF"/>
   <Interior ss:Color="#1570EF" ss:Pattern="Solid"/>
  </Style>
 </Styles>
 <Worksheet ss:Name="${esc(sheetName).slice(0, 30)}">
  <Table>${headerRow}
${bodyRows}
  </Table>
 </Worksheet>
</Workbook>`
}

export const HW_CATEGORIES = ['Laptop', 'Monitor', 'Phone', 'Tablet', 'Printer', 'Server', 'Networking', 'Peripheral']
export const ASSET_STATUSES = ['IN_STOCK', 'ASSIGNED', 'REPAIR', 'RETIRED']
