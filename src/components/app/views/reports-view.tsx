'use client'

import { useMemo, useState } from 'react'
import {
  Package, IdCard, FileSignature, ArrowLeftRight, Wrench, ShieldHalf, ShieldCheck,
  FileDown, FileSpreadsheet, FileText, RefreshCw, CalendarClock, ClipboardList,
  RotateCcw, CheckCircle2, Users2, Wrench as WrenchIcon, ShieldAlert,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useApp, useFetch } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge, KpiCard, PageHeader, Pagination, SectionHeader, Tone, istShort } from '@/components/app/shared'
import { useToast } from '@/hooks/use-toast'
import { HW_CATEGORIES, DEPARTMENTS, DISPATCH_FREQUENCIES } from '@/lib/constants'

/* ---------------- category meta (mirrors the Figma list) ---------------- */

const CATEGORIES: {
  key: string; num: number; name: string; badge: Tone; desc: string
  icon: typeof Package; tile: string; paramTitle: string
}[] = [
  { key: 'inventory', num: 1, name: 'Current Inventory Master', badge: 'core', desc: 'Master hardware list. Serial tags, condition, purchase costs & company ownership.', icon: Package, tile: 'bg-blue-600', paramTitle: 'INVENTORY MASTER PARAMETERS' },
  { key: 'employee', num: 2, name: 'Employee Asset Statement', badge: 'custody', desc: 'Comprehensive breakdown of all hardware & software keys issued per employee.', icon: IdCard, tile: 'bg-violet-500', paramTitle: 'EMPLOYEE ASSET STATEMENT PARAMETERS' },
  { key: 'assignment', num: 3, name: 'Assignment Register', badge: 'handover', desc: 'Signed handover receipts, issuance dates, expected return dates & signoffs.', icon: FileSignature, tile: 'bg-emerald-500', paramTitle: 'ASSIGNMENT REGISTER PARAMETERS' },
  { key: 'transfer', num: 4, name: 'Transfer History Log', badge: 'chain', desc: 'Inter-departmental and inter-company custody transfers and historical lineage.', icon: ArrowLeftRight, tile: 'bg-teal-500', paramTitle: 'TRANSFER HISTORY PARAMETERS' },
  { key: 'repair', num: 5, name: 'Defective / Repair Register', badge: 'maintenance', desc: 'RMA cases, vendor service tickets, repair costs, and downtime tracking.', icon: Wrench, tile: 'bg-rose-500', paramTitle: 'REPAIR REGISTER PARAMETERS' },
  { key: 'expiry', num: 6, name: 'Expiry & Warranty Report', badge: 'lifecycle', desc: 'Upcoming hardware warranty end dates and software license expiration timelines.', icon: ShieldHalf, tile: 'bg-amber-500', paramTitle: 'EXPIRY & WARRANTY PARAMETERS' },
  { key: 'audit', num: 7, name: 'System Asset Audit Trail', badge: 'security', desc: 'Immutable event history, administrative field changes, and operator stamps.', icon: ShieldCheck, tile: 'bg-slate-900', paramTitle: 'SYSTEM ASSET AUDIT TRAIL PARAMETERS' },
]

type FilterDef = { label: string; allLabel: string; options: { value: string; label: string }[] }

const FILTER_A: Record<string, FilterDef> = {
  inventory: { label: 'Hardware Category', allLabel: 'All Categories', options: HW_CATEGORIES.map((c) => ({ value: c, label: c })) },
  employee: { label: 'Department', allLabel: 'All Departments', options: DEPARTMENTS.map((c) => ({ value: c, label: c })) },
  assignment: { label: 'Hardware Category', allLabel: 'All Categories', options: HW_CATEGORIES.map((c) => ({ value: c, label: c })) },
  transfer: { label: 'Destination Department', allLabel: 'All Departments', options: DEPARTMENTS.map((c) => ({ value: c, label: c })) },
  repair: { label: 'Case Status', allLabel: 'All Case States', options: [{ value: 'OPEN', label: 'Open' }, { value: 'IN_PROGRESS', label: 'In Progress' }, { value: 'RESOLVED', label: 'Resolved' }] },
  expiry: { label: 'Item Type', allLabel: 'All Item Types', options: [{ value: 'Software License', label: 'Software Licenses' }, ...HW_CATEGORIES.map((c) => ({ value: c, label: c }))] },
  audit: { label: 'Hardware Category', allLabel: 'All Categories', options: HW_CATEGORIES.map((c) => ({ value: c, label: c })) },
}

const FILTER_B: Record<string, FilterDef> = {
  inventory: { label: 'Asset Status', allLabel: 'All Asset States', options: [{ value: 'IN_STOCK', label: 'In Stock' }, { value: 'ASSIGNED', label: 'Assigned' }, { value: 'REPAIR', label: 'Under Repair' }, { value: 'RETIRED', label: 'Retired' }] },
  employee: { label: 'Employee', allLabel: 'All Employees', options: [] }, // populated at runtime
  assignment: { label: 'Owning Department', allLabel: 'All Departments', options: DEPARTMENTS.map((c) => ({ value: c, label: c })) },
  transfer: { label: 'Operator', allLabel: 'All Operators', options: [{ value: 'Sarah Jenkins', label: 'Sarah Jenkins' }, { value: 'David Miller', label: 'David Miller' }] },
  repair: { label: 'Vendor', allLabel: 'All Vendors', options: [] }, // runtime
  expiry: { label: 'Expiry Window', allLabel: 'Any Timeline', options: [{ value: '30d', label: 'Next 30 days' }, { value: '60d', label: 'Next 60 days' }, { value: '90d', label: 'Next 90 days' }] },
  audit: { label: 'Asset Status', allLabel: 'All Asset States', options: [{ value: 'ASSIGNED', label: 'Assignment Events' }, { value: 'RETURNED', label: 'Return Events' }, { value: 'REPAIR', label: 'Repair Events' }, { value: 'TRANSFER', label: 'Transfer Events' }, { value: 'CONFIG', label: 'Config Edits' }, { value: 'REGISTRATION', label: 'Registration Events' }] },
}

type Section = {
  key: string; title: string; headers: string[]
  rows: { text: string; tone?: string }[][]
  total: number; page: number; pageSize: number; refreshedAt: string
}

type Stats = {
  kpis: { total: number; assigned: number; repair: number; utilization: number; downtime: number; warrantyAlerts: number }
}

type Bootstrap = { companies: { code: string; name: string }[] }

/* ---------------- view ---------------- */

export function ReportsView() {
  const { scope, setScope, reportsCategory, setReportsCategory, bumpRefresh, refreshKey } = useApp()
  const { toast } = useToast()
  const [filterA, setFilterA] = useState('ALL')
  const [filterB, setFilterB] = useState('ALL')
  const [exportFormat, setExportFormat] = useState('PDF')
  const [page, setPage] = useState(1)

  const cat = CATEGORIES.find((c) => c.key === reportsCategory) ?? CATEGORIES[6]
  const paramTitle = cat.paramTitle
  const defA = FILTER_A[cat.key]
  const defB = FILTER_B[cat.key]

  const { data: stats } = useFetch<Stats>(`/api/stats?company=${scope}`, [refreshKey])
  const { data: boot } = useFetch<Bootstrap>('/api/bootstrap', [refreshKey])
  const { data: vendors } = useFetch<{ vendors: { id: string; name: string }[] }>(cat.key === 'repair' ? `/api/vendors?company=${scope}` : null)
  const { data: emps } = useFetch<{ employees: { id: string; name: string }[] }>(cat.key === 'employee' ? `/api/employees?company=${scope}` : null)
  const { data: dispatch } = useFetch<{ schedule: { frequency: string; recipients: string; isActive: boolean } | null }>('/api/dispatch')
  const [freq, setFreq] = useState<string | null>(null)
  const [savingFreq, setSavingFreq] = useState(false)

  const query = useMemo(() => {
    const p = new URLSearchParams({ category: reportsCategory, company: scope, filterA, filterB, page: String(page), pageSize: '5' })
    return '/api/reports/preview?' + p.toString()
  }, [reportsCategory, scope, filterA, filterB, page])

  const { data: section, loading } = useFetch<Section>(query, [refreshKey])

  function selectCategory(key: string) {
    setReportsCategory(key)
    setFilterA('ALL')
    setFilterB('ALL')
    setPage(1)
  }

  function resetFilters() {
    setFilterA('ALL')
    setFilterB('ALL')
    setPage(1)
    toast({ title: 'Filters reset', description: 'Parameter panel restored to defaults.' })
  }

  async function exportData(kind: 'pdf' | 'xls' | 'csv') {
    const p = new URLSearchParams({ category: reportsCategory, company: scope, filterA, filterB, format: kind === 'pdf' ? 'json' : kind })
    try {
      if (kind === 'pdf') {
        const res = await fetch('/api/reports/export?' + p.toString())
        const data = await res.json()
        const win = window.open('', '_blank')
        if (!win) throw new Error('Popup blocked — allow popups to export PDF')
        const now = istShort(new Date())
        win.document.write(`<!DOCTYPE html><html><head><title>${data.title}</title>
          <style>
            body{font-family:Inter,Arial,sans-serif;padding:36px;color:#101828}
            h1{font-size:19px;margin:0 0 2px}
            .sub{color:#667085;font-size:11px;margin-bottom:4px}
            .meta{color:#98A2B3;font-size:10px;margin-bottom:18px}
            table{width:100%;border-collapse:collapse;font-size:10px}
            th{background:#F2F4F7;text-align:left;padding:7px 8px;border-bottom:1.5px solid #D0D5DD;text-transform:uppercase;font-size:8.5px;letter-spacing:.4px;color:#475467}
            td{padding:7px 8px;border-bottom:1px solid #EAECF0;vertical-align:top}
            .foot{margin-top:22px;color:#98A2B3;font-size:9.5px}
            .tag{font-family:monospace;color:#1570EF;font-weight:600}
          </style></head><body>
          <h1>${data.title} — Compliance Statement</h1>
          <div class="sub">IT Asset Hub · Enterprise Asset Operations · ${data.company} scope</div>
          <div class="meta">Generated ${now} · ${data.total.toLocaleString('en-US')} records (capped at 5,000 rows per statement)</div>
          <table><thead><tr>${data.headers.map((h: string) => `<th>${h}</th>`).join('')}</tr></thead>
          <tbody>${data.rows.map((r: string[]) => `<tr>${r.map((c: string) => `<td>${String(c).replace(/</g, '&lt;')}</td>`).join('')}</tr>`).join('')}</tbody></table>
          <div class="foot">Checksum-verified extract · Immutable audit lineage retained 36 months · IT Asset Hub Report Generator Hub</div>
          <script>window.onload=function(){setTimeout(function(){window.print()},250)}</script>
          </body></html>`)
        win.document.close()
        toast({ title: 'PDF statement ready', description: 'Use the print dialog → "Save as PDF" to archive the statement.' })
      } else {
        const res = await fetch('/api/reports/export?' + p.toString())
        const blob = await res.blob()
        const cd = res.headers.get('Content-Disposition') || ''
        const m = cd.match(/filename="(.+)"/)
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = m ? m[1] : `export.${kind}`
        a.click()
        URL.revokeObjectURL(url)
        toast({ title: kind === 'xls' ? 'Excel workbook downloaded' : 'CSV dataset downloaded', description: 'Filters and scope were applied to the extract.' })
      }
    } catch (e) {
      toast({ title: 'Export failed', description: e instanceof Error ? e.message : 'Unknown error', variant: 'destructive' })
    }
  }

  async function saveSchedule() {
    setSavingFreq(true)
    try {
      const res = await fetch('/api/dispatch', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ frequency: freq ?? dispatch?.schedule?.frequency ?? 'Monthly (1st Day 09:00 AM)', isActive: (freq ?? dispatch?.schedule?.frequency) !== 'Off — paused' }),
      })
      if (!res.ok) throw new Error()
      toast({ title: 'Dispatch schedule saved', description: 'Automated statements will follow the selected cadence.' })
      bumpRefresh()
    } catch {
      toast({ title: 'Could not save schedule', variant: 'destructive' })
    } finally {
      setSavingFreq(false)
    }
  }

  const k = stats?.kpis
  const bOptions = defB.options.length
    ? defB.options
    : cat.key === 'repair'
      ? (vendors?.vendors ?? []).map((v) => ({ value: v.name, label: v.name }))
      : (emps?.employees ?? []).slice(0, 300).map((e) => ({ value: e.name, label: e.name }))

  return (
    <div className="mx-auto max-w-[1400px]">
      <PageHeader
        breadcrumb={['Analytics Center', 'Report Generator Hub']}
        title="Enterprise Asset Reports & Export Engine"
        subtitle="Generate, schedule, filter, and export compliance-ready statements across inventory, employee custody, repair registers, and audit trails."
        actions={
          <>
            <Button variant="outline" onClick={() => exportData('pdf')} className="h-9 gap-2 rounded-lg border-gray-200 text-[12.5px] font-semibold text-gray-700 hover:bg-gray-50">
              <FileText className="h-4 w-4 text-rose-500" /> Export PDF Statement
            </Button>
            <Button variant="outline" onClick={() => exportData('xls')} className="h-9 gap-2 rounded-lg border-gray-200 text-[12.5px] font-semibold text-gray-700 hover:bg-gray-50">
              <FileSpreadsheet className="h-4 w-4 text-emerald-500" /> Export Excel (.xlsx)
            </Button>
            <Button onClick={() => exportData('csv')} className="h-9 gap-2 rounded-lg bg-blue-600 text-[12.5px] font-semibold text-white hover:bg-blue-700">
              <FileDown className="h-4 w-4" /> Export CSV Data
            </Button>
          </>
        }
      />

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-3.5 xl:grid-cols-4">
        <KpiCard
          label="TOTAL REGISTERED ASSETS" value={(k?.total ?? 0).toLocaleString('en-US')}
          sub={<><CheckCircle2 className="h-3 w-3" /> 100% Audited Scope</>} subTone="green"
          icon={<span className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50"><Package className="h-[18px] w-[18px] text-blue-600" /></span>}
        />
        <KpiCard
          label="ASSIGNED / ACTIVE STATEMENTS" value={(k?.assigned ?? 0).toLocaleString('en-US')}
          sub={<><Users2 className="h-3 w-3" /> {k?.utilization ?? 0}% Utilization</>} subTone="violet"
          icon={<span className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-50"><ClipboardList className="h-[18px] w-[18px] text-violet-600" /></span>}
        />
        <KpiCard
          label="DEFECTIVE / UNDER REPAIR" value={(k?.repair ?? 0).toLocaleString('en-US')}
          sub={<><WrenchIcon className="h-3 w-3" /> {k?.downtime ?? 0}% Hardware Downtime</>} subTone="red"
          icon={<span className="flex h-10 w-10 items-center justify-center rounded-lg bg-rose-50"><Wrench className="h-[18px] w-[18px] text-rose-500" /></span>}
        />
        <KpiCard
          label="WARRANTY & EXPIRY ALERTS" value={(k?.warrantyAlerts ?? 0).toLocaleString('en-US')}
          sub={<><ShieldAlert className="h-3 w-3" /> Expiry within 60 Days</>} subTone="amber"
          icon={<span className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50"><ShieldHalf className="h-[18px] w-[18px] text-amber-500" /></span>}
        />
      </div>

      {/* main grid */}
      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[440px_1fr]">
        {/* -------- left column -------- */}
        <div className="flex flex-col gap-4">
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <SectionHeader
              icon={<Package className="h-4 w-4 text-blue-600" />}
              title="REPORT CATEGORIES"
              right={<Badge tone="core">7 Standard Reports</Badge>}
            />
            <div className="mt-3 space-y-2.5">
              {CATEGORIES.map((c) => {
                const Icon = c.icon
                const active = c.key === reportsCategory
                return (
                  <button
                    key={c.key}
                    onClick={() => selectCategory(c.key)}
                    className={cn(
                      'flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-all',
                      active
                        ? 'border-blue-500 bg-blue-50/40 shadow-[0_0_0_1px_rgba(21,112,239,0.25)]'
                        : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50/60'
                    )}
                  >
                    <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', c.tile)}>
                      <Icon className="h-[17px] w-[17px] text-white" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-start justify-between gap-2">
                        <span className="text-[13px] font-bold text-gray-900">{c.num}. {c.name}</span>
                        <Badge tone={c.badge} className="shrink-0">{c.badge.charAt(0).toUpperCase() + c.badge.slice(1)}</Badge>
                      </span>
                      <span className="mt-0.5 block text-[11.5px] leading-snug text-gray-500">{c.desc}</span>
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Dispatch automation — dark card */}
          <div className="rounded-xl bg-[#141B2B] p-4 text-white shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <CalendarClock className="h-4 w-4 text-blue-400" />
                <h3 className="text-[12px] font-bold tracking-wide">REPORT DISPATCH AUTOMATION</h3>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Active Core
              </span>
            </div>
            <p className="mt-2.5 text-[11.5px] leading-relaxed text-slate-300/90">
              Automatically email consolidated PDF / Excel statements to compliance officers and department leads.
            </p>
            <div className="mt-3.5 flex items-center gap-2.5">
              <Select
                value={freq ?? dispatch?.schedule?.frequency ?? 'Monthly (1st Day 09:00 AM)'}
                onValueChange={setFreq}
              >
                <SelectTrigger className="h-9 flex-1 border-0 bg-white/10 text-[12px] font-medium text-white focus:ring-1 focus:ring-blue-500 [&>span]:truncate [&>svg]:text-slate-400">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DISPATCH_FREQUENCIES.map((f) => <SelectItem key={f} value={f} className="text-[12px]">{f}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button onClick={saveSchedule} disabled={savingFreq} className="h-9 rounded-lg bg-blue-600 px-4 text-[12px] font-semibold text-white hover:bg-blue-500">
                {savingFreq ? 'Saving…' : 'Save Schedule'}
              </Button>
            </div>
            <p className="mt-2 truncate text-[10px] text-slate-400/80">
              Recipients: {dispatch?.schedule?.recipients ?? 'compliance@acme.com, dept-leads@acme.com'}
            </p>
          </div>
        </div>

        {/* -------- right column -------- */}
        <div className="flex flex-col gap-4">
          {/* parameters */}
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-[12px] font-bold tracking-wide text-gray-800">{paramTitle}</h3>
                {cat.key === 'audit' ? (
                  <p className="mt-0.5 text-[11.5px] text-gray-400">Immutable event history, administrative field changes, and operator stamps.</p>
                ) : (
                  <p className="mt-0.5 text-[11.5px] text-gray-400">Scope the statement dataset before streaming, scheduling or export.</p>
                )}
              </div>
              <button onClick={resetFilters} className="flex shrink-0 items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-semibold text-gray-500 hover:bg-gray-50">
                <RotateCcw className="h-3 w-3" /> Reset Filters
              </button>
            </div>
            <div className="mt-3.5 grid grid-cols-2 gap-3 lg:grid-cols-4">
              <div>
                <Label text="Company Scope" />
                <Select
                  value={scope}
                  onValueChange={(v) => {
                    const c = boot?.companies.find((x) => x.code === v)
                    if (c) setScope(c.code, `${c.name} (${c.code})`)
                    setPage(1)
                  }}
                >
                  <SelectTrigger className="mt-1 h-9 text-[12px]">
                    <SelectValue placeholder="Select scope" />
                  </SelectTrigger>
                  <SelectContent>
                    {(boot?.companies ?? []).map((c) => (
                      <SelectItem key={c.code} value={c.code} className="text-[12px]">
                        {c.name} ({c.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label text={defA.label} />
                <Select value={filterA} onValueChange={(v) => { setFilterA(v); setPage(1) }}>
                  <SelectTrigger className="mt-1 h-9 text-[12px]"><SelectValue /></SelectTrigger>
                  <SelectContent className="max-h-64">
                    <SelectItem value="ALL" className="text-[12px]">{defA.allLabel}</SelectItem>
                    {defA.options.map((o) => <SelectItem key={o.value} value={o.value} className="text-[12px]">{o.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label text={defB.label} />
                <Select value={filterB} onValueChange={(v) => { setFilterB(v); setPage(1) }}>
                  <SelectTrigger className="mt-1 h-9 text-[12px]"><SelectValue /></SelectTrigger>
                  <SelectContent className="max-h-64">
                    <SelectItem value="ALL" className="text-[12px]">{defB.allLabel}</SelectItem>
                    {bOptions.map((o) => <SelectItem key={o.value} value={o.value} className="text-[12px]">{o.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label text="Target Export Format" />
                <Select value={exportFormat} onValueChange={setExportFormat}>
                  <SelectTrigger className="mt-1 h-9 text-[12px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PDF" className="text-[12px]">PDF Document (.pdf)</SelectItem>
                    <SelectItem value="XLSX" className="text-[12px]">Excel Workbook (.xlsx)</SelectItem>
                    <SelectItem value="CSV" className="text-[12px]">CSV Data (.csv)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* live preview */}
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <SectionHeader icon={<Package className="h-4 w-4 text-blue-600" />} title="LIVE REPORT DATA STREAM PREVIEW" />
                <Badge tone="core">Showing {cat.name}</Badge>
              </div>
              <span className="flex items-center gap-1.5 text-[10.5px] text-gray-400">
                <RefreshCw className="h-3 w-3" />
                Refreshed: {istShort(section?.refreshedAt ? new Date(section.refreshedAt) : new Date())}
              </span>
            </div>

            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[760px] border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50/70">
                    {section?.headers.map((h) => (
                      <th key={h} className="px-3 py-2.5 text-left text-[9.5px] font-bold tracking-wide text-gray-500 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading && !section ? (
                    <tr><td colSpan={7} className="px-3 py-10 text-center text-xs text-gray-400">Streaming report data…</td></tr>
                  ) : section?.rows.length ? (
                    section.rows.map((r, i) => (
                      <tr key={i} className="border-b border-gray-100 transition-colors last:border-0 hover:bg-blue-50/30">
                        {r.map((cell, j) => (
                          <td key={j} className="px-3 py-2.5 align-top text-[11.5px] leading-snug text-gray-700">
                            <CellText text={cell.text} tone={cell.tone} />
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan={7} className="px-3 py-10 text-center text-xs text-gray-400">No records match the current parameters.</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {section ? (
              <Pagination page={section.page} pageSize={section.pageSize} total={section.total} onPage={setPage} />
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}

function Label({ text }: { text: string }) {
  return <span className="text-[10.5px] font-semibold text-gray-500">{text}</span>
}

function CellText({ text, tone }: { text: string; tone?: string }) {
  const cls =
    tone === 'asset' ? 'font-mono text-[11px] font-semibold text-blue-700'
    : tone === 'mono' ? 'font-mono text-[10.5px] text-gray-500'
    : tone === 'green' ? 'font-medium text-emerald-600'
    : tone === 'amber' ? 'font-medium text-amber-600'
    : tone === 'red' ? 'font-medium text-rose-600'
    : tone === 'blue' ? 'font-medium text-blue-700'
    : tone === 'muted' ? 'text-gray-400'
    : tone === 'strong' ? 'font-semibold text-gray-800'
    : ''
  return <span className={cn(cls)}>{text}</span>
}
