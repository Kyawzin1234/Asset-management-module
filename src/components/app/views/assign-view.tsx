'use client'

import { useState } from 'react'
import { FileOutput, Search } from 'lucide-react'
import { useApp, useFetch } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PageHeader, Pagination, StatusPill, dateOnly, ist } from '@/components/app/shared'
import { useToast } from '@/hooks/use-toast'

type Asg = {
  id: string; receiptId: string; issuedAt: string; expectedReturnAt: string | null
  signoffBy: string | null; status: string
  asset: { assetTag: string; name: string; category: string }
  employee: { name: string; department: string; designation: string }
}
type AsgResp = { assignments: Asg[]; total: number; page: number; pageSize: number }

export function AssignView() {
  const { scope, refreshKey, bumpRefresh } = useApp()
  const { toast } = useToast()
  const [assetId, setAssetId] = useState('')
  const [employeeId, setEmployeeId] = useState('')
  const [expected, setExpected] = useState('')
  const [saving, setSaving] = useState(false)
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)

  const { data: stock } = useFetch<{ assets: { id: string; assetTag: string; name: string }[] }>(
    `/api/assets?company=${scope}&status=IN_STOCK&pageSize=100`, [refreshKey]
  )
  const { data: emps } = useFetch<{ employees: { id: string; name: string; department: string; designation: string }[] }>(
    `/api/employees?company=${scope}`, [refreshKey]
  )
  const { data, loading } = useFetch<AsgResp>(
    `/api/assignments?company=${scope}&status=ACTIVE&q=${encodeURIComponent(q)}&page=${page}&pageSize=8`, [refreshKey]
  )

  async function submit() {
    if (!assetId || !employeeId) {
      toast({ title: 'Missing fields', description: 'Select both an in-stock asset and an employee.', variant: 'destructive' })
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/assignments', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assetId, employeeId, expectedReturnAt: expected || undefined }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error || 'Failed')
      toast({ title: 'Custody assigned', description: `Handover receipt ${d.assignment.receiptId} signed & logged into the audit stream.` })
      setAssetId(''); setEmployeeId(''); setExpected('')
      bumpRefresh()
    } catch (e) {
      toast({ title: 'Could not assign', description: e instanceof Error ? e.message : 'Unknown error', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-[1400px]">
      <PageHeader
        breadcrumb={['Custody Operations', 'Assign Assets']}
        title="Assign Assets — Signed Handover"
        subtitle="Issue hardware into employee custody with signed handover receipts, issuance dates, expected returns and operator signoffs."
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[400px_1fr]">
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500">
              <FileOutput className="h-[17px] w-[17px] text-white" />
            </span>
            <div>
              <h3 className="text-[12.5px] font-bold text-gray-800">New Handover</h3>
              <p className="text-[10.5px] text-gray-400">Generates a receipt & audit entry</p>
            </div>
          </div>
          <div className="mt-4 space-y-3.5">
            <div>
              <Label className="text-[11px] font-semibold text-gray-600">In-stock Asset *</Label>
              <Select value={assetId} onValueChange={setAssetId}>
                <SelectTrigger className="mt-1 h-9 text-[12.5px]"><SelectValue placeholder="Select asset" /></SelectTrigger>
                <SelectContent className="max-h-64">
                  {(stock?.assets ?? []).map((a) => (
                    <SelectItem key={a.id} value={a.id} className="text-[12px]">
                      <span className="font-mono text-[11px]">{a.assetTag}</span> — {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[11px] font-semibold text-gray-600">Employee *</Label>
              <Select value={employeeId} onValueChange={setEmployeeId}>
                <SelectTrigger className="mt-1 h-9 text-[12.5px]"><SelectValue placeholder="Select employee" /></SelectTrigger>
                <SelectContent className="max-h-64">
                  {(emps?.employees ?? []).map((e) => (
                    <SelectItem key={e.id} value={e.id} className="text-[12px]">{e.name} — {e.department}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[11px] font-semibold text-gray-600">Expected Return Date</Label>
              <Input type="date" value={expected} onChange={(e) => setExpected(e.target.value)} className="mt-1 h-9 text-[12.5px]" />
            </div>
            <Button onClick={submit} disabled={saving} className="h-9 w-full rounded-lg bg-blue-600 text-[12.5px] font-semibold text-white hover:bg-blue-700">
              {saving ? 'Signing handover…' : 'Assign Custody'}
            </Button>
            <p className="text-[10.5px] leading-relaxed text-gray-400">
              The asset flips to <span className="font-semibold text-gray-600">Assigned</span>, a receipt ID is minted (ASG-YYYY-XXXXX) and the custody event is checksummed into the audit trail.
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-[12.5px] font-bold text-gray-800">Active Custody Register</h3>
              <p className="text-[10.5px] text-gray-400">Currently issued hardware with signed receipts</p>
            </div>
            <div className="relative sm:w-[280px]">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
              <Input value={q} onChange={(e) => { setQ(e.target.value); setPage(1) }} placeholder="Search receipt, tag or employee…" className="h-9 pl-9 text-[12px]" />
            </div>
          </div>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/70">
                  {['RECEIPT ID', 'ASSET', 'ISSUED TO', 'ISSUED ON', 'EXPECTED RETURN', 'SIGNOFF', 'STATE'].map((h) => (
                    <th key={h} className="px-3 py-2.5 text-left text-[9.5px] font-bold tracking-wide text-gray-500 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading && !data ? (
                  <tr><td colSpan={7} className="py-10 text-center text-xs text-gray-400">Loading assignments…</td></tr>
                ) : data?.assignments.length ? (
                  data.assignments.map((a) => (
                    <tr key={a.id} className="border-b border-gray-100 last:border-0 hover:bg-blue-50/30">
                      <td className="px-3 py-2.5 font-mono text-[11px] text-gray-500">{a.receiptId}</td>
                      <td className="px-3 py-2.5">
                        <span className="block font-mono text-[11px] font-semibold text-blue-700">{a.asset.assetTag}</span>
                        <span className="text-[10.5px] text-gray-500">{a.asset.name}</span>
                      </td>
                      <td className="px-3 py-2.5 text-[11.5px] text-gray-700">
                        <span className="block font-medium">{a.employee.name}</span>
                        <span className="text-[10.5px] text-gray-400">{a.employee.department}</span>
                      </td>
                      <td className="px-3 py-2.5 text-[11px] text-gray-500">{ist(a.issuedAt, false)}</td>
                      <td className="px-3 py-2.5 text-[11px] text-gray-500">{dateOnly(a.expectedReturnAt)}</td>
                      <td className="px-3 py-2.5 text-[11px] font-medium text-emerald-600">{a.signoffBy ?? 'Signed'}</td>
                      <td className="px-3 py-2.5"><StatusPill status={a.status} /></td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan={7} className="py-10 text-center text-xs text-gray-400">No active assignments found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
          {data ? <Pagination page={data.page} pageSize={data.pageSize} total={data.total} onPage={setPage} /> : null}
        </div>
      </div>
    </div>
  )
}
