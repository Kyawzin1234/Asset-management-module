'use client'

import { useState } from 'react'
import { Search, Settings2, ShieldCheck, Fingerprint, Save } from 'lucide-react'
import { useApp, useFetch } from '@/lib/store'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PageHeader, Pagination, ist } from '@/components/app/shared'
import { useToast } from '@/hooks/use-toast'

type Log = {
  id: string; timestamp: string; category: string; operator: string
  affectedRecord: string; actionDetails: string; checksum: string; severity: string
}
type LogResp = { logs: Log[]; total: number; categories: string[] }

const SEV_CLS: Record<string, string> = {
  INFO: 'bg-blue-50 text-blue-600',
  WARNING: 'bg-amber-50 text-amber-600',
  CRITICAL: 'bg-rose-50 text-rose-600',
}

export function SettingsView() {
  const { refreshKey } = useApp()
  const { toast } = useToast()
  const [category, setCategory] = useState('ALL')
  const [q, setQ] = useState('')
  const [limit, setLimit] = useState(20)
  const [prefix, setPrefix] = useState('AST-')
  const [separator, setSeparator] = useState('-')

  const { data, loading } = useFetch<LogResp>(
    `/api/audit?category=${encodeURIComponent(category)}&q=${encodeURIComponent(q)}&limit=${limit}`, [refreshKey, category, q, limit]
  )

  return (
    <div className="mx-auto max-w-[1400px]">
      <PageHeader
        breadcrumb={['Administration', 'Settings & Audit Log']}
        title="System Settings & Immutable Audit Log"
        subtitle="Administrative configuration plus the full checksum-verified event history — config edits, custody changes, and operator stamps."
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[380px_1fr]">
        <div className="flex flex-col gap-4">
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600">
                <Fingerprint className="h-[17px] w-[17px] text-white" />
              </span>
              <div>
                <h3 className="text-[12.5px] font-bold text-gray-800">Asset ID Rule Syntax</h3>
                <p className="text-[10.5px] text-gray-400">Global Asset Tag format rule</p>
              </div>
            </div>
            <div className="mt-3.5 flex items-end gap-2">
              <div className="flex-1">
                <label className="text-[10.5px] font-semibold text-gray-500">Prefix</label>
                <Input value={prefix} onChange={(e) => setPrefix(e.target.value.toUpperCase())} className="mt-1 h-9 font-mono text-[12px]" maxLength={6} />
              </div>
              <div className="w-20">
                <label className="text-[10.5px] font-semibold text-gray-500">Separator</label>
                <Select value={separator} onValueChange={setSeparator}>
                  <SelectTrigger className="mt-1 h-9 text-[12px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="-">Dash</SelectItem>
                    <SelectItem value="_">Underscore</SelectItem>
                    <SelectItem value="/">Slash</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="mt-3 rounded-lg border border-dashed border-gray-200 bg-gray-50/70 px-3 py-2.5">
              <p className="text-[9.5px] font-bold uppercase tracking-widest text-gray-400">Preview</p>
              <p className="mt-0.5 font-mono text-[12px] font-semibold text-blue-700">
                {prefix}ACME{separator}LAP{separator}26{separator}00418
              </p>
            </div>
            <Button
              size="sm"
              className="mt-3 h-8.5 w-full gap-1.5 rounded-lg bg-blue-600 text-[12px] font-semibold text-white hover:bg-blue-700"
              onClick={() => toast({ title: 'ID rule saved', description: 'New registrations will follow the updated tag syntax.' })}
            >
              <Save className="h-3.5 w-3.5" /> Save ID Rule
            </Button>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900">
                <Settings2 className="h-[17px] w-[17px] text-white" />
              </span>
              <div>
                <h3 className="text-[12.5px] font-bold text-gray-800">Stream Retention</h3>
                <p className="text-[10.5px] text-gray-400">Immutable window for the audit lineage</p>
              </div>
            </div>
            <div className="mt-3 space-y-2">
              {[
                { label: 'Audit retention window', value: '36 months' },
                { label: 'Checksum algorithm', value: 'CRC-24 (0x hex)' },
                { label: 'Export cap per statement', value: '5,000 rows' },
                { label: 'Timezone for statements', value: 'IST (UTC+5:30)' },
              ].map((r) => (
                <div key={r.label} className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50/60 px-3 py-2">
                  <span className="text-[11px] text-gray-600">{r.label}</span>
                  <span className="text-[11px] font-bold text-gray-800">{r.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-slate-800" />
            <div>
              <h3 className="text-[12.5px] font-bold text-gray-800">Full Audit Trail</h3>
              <p className="text-[10.5px] text-gray-400">{(data?.total ?? 0).toLocaleString('en-US')} immutable records in the stream</p>
            </div>
          </div>

          <div className="mt-3 flex flex-col gap-2.5 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search record, action details or operator…" className="h-9 pl-9 text-[12.5px]" />
            </div>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="h-9 text-[12px] sm:w-[210px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL" className="text-[12px]">All Event Categories</SelectItem>
                {(data?.categories ?? []).map((c) => <SelectItem key={c} value={c} className="text-[12px]">{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="mt-3 space-y-1.5">
            {loading && !data ? (
              <p className="py-10 text-center text-xs text-gray-400">Loading audit stream…</p>
            ) : (data?.logs ?? []).map((l) => (
              <div key={l.id} className="flex items-start justify-between gap-3 rounded-lg border border-gray-100 px-3 py-2.5 transition-colors hover:bg-gray-50/70">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-[10.5px] text-gray-400">{ist(l.timestamp)}</span>
                    <span className={`rounded-md px-1.5 py-0.5 text-[9px] font-bold ${SEV_CLS[l.severity] ?? SEV_CLS.INFO}`}>{l.severity}</span>
                    <span className="text-[11px] font-bold text-gray-800">{l.category}</span>
                  </div>
                  <p className="mt-0.5 text-[11.5px] leading-snug text-gray-600">
                    <span className={`font-mono text-[10.5px] ${l.affectedRecord.startsWith('AST-') ? 'font-semibold text-blue-700' : 'font-semibold text-gray-700'}`}>
                      {l.affectedRecord}
                    </span>
                    {' — '}{l.actionDetails}
                  </p>
                  <p className="mt-0.5 text-[10px] text-gray-400">Operator: {l.operator} · Checksum {l.checksum}</p>
                </div>
              </div>
            ))}
            {data && !data.logs.length ? <p className="py-10 text-center text-xs text-gray-400">No audit records match the filters.</p> : null}
          </div>

          {data && data.logs.length >= limit ? (
            <div className="pt-3 text-center">
              <Button variant="outline" size="sm" className="h-8 rounded-lg text-[11.5px]" onClick={() => setLimit((l) => l + 20)}>
                Load 20 more events
              </Button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
