'use client'

import { useState } from 'react'
import { Undo2 } from 'lucide-react'
import { useApp, useFetch } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { PageHeader, Pagination, StatusPill, ist } from '@/components/app/shared'
import { useToast } from '@/hooks/use-toast'

type Ret = {
  id: string; returnId: string; returnedAt: string; condition: string; reason: string; processedBy: string
  assignment: {
    receiptId: string
    asset: { assetTag: string; name: string }
    employee: { name: string }
  }
}
type RetResp = { returns: Ret[]; total: number; page: number; pageSize: number }

export function ReturnView() {
  const { scope, refreshKey, bumpRefresh } = useApp()
  const { toast } = useToast()
  const [assignmentId, setAssignmentId] = useState('')
  const [condition, setCondition] = useState('Good')
  const [reason, setReason] = useState('Routine Swap')
  const [markRepair, setMarkRepair] = useState(false)
  const [saving, setSaving] = useState(false)
  const [page, setPage] = useState(1)

  const { data: active } = useFetch<{ assignments: { id: string; receiptId: string; asset: { assetTag: string; name: string }; employee: { name: string } }[] }>(
    `/api/assignments?company=${scope}&status=ACTIVE&pageSize=100`, [refreshKey]
  )
  const { data, loading } = useFetch<RetResp>(`/api/returns?company=${scope}&page=${page}&pageSize=8`, [refreshKey])

  async function submit() {
    if (!assignmentId) {
      toast({ title: 'Missing fields', description: 'Select an active assignment to close.', variant: 'destructive' })
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/returns', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignmentId, condition, reason, markRepair }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error || 'Failed')
      toast({ title: 'Return processed', description: `${d.return.returnId} — custody closed, asset ${markRepair ? 'routed to repair' : 'restocked'}.` })
      setAssignmentId(''); setMarkRepair(false)
      bumpRefresh()
    } catch (e) {
      toast({ title: 'Could not process return', description: e instanceof Error ? e.message : 'Unknown error', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-[1400px]">
      <PageHeader
        breadcrumb={['Custody Operations', 'Return Assets']}
        title="Return Assets — Verify & Restock"
        subtitle="Close active custody with condition verification — restock to the available pool or route defective units straight into the repair register."
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[400px_1fr]">
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500">
              <Undo2 className="h-[17px] w-[17px] text-white" />
            </span>
            <div>
              <h3 className="text-[12.5px] font-bold text-gray-800">Process Return</h3>
              <p className="text-[10.5px] text-gray-400">Condition check & restock decision</p>
            </div>
          </div>
          <div className="mt-4 space-y-3.5">
            <div>
              <Label className="text-[11px] font-semibold text-gray-600">Active Assignment *</Label>
              <Select value={assignmentId} onValueChange={setAssignmentId}>
                <SelectTrigger className="mt-1 h-9 text-[12.5px]"><SelectValue placeholder="Select assignment" /></SelectTrigger>
                <SelectContent className="max-h-64">
                  {(active?.assignments ?? []).map((a) => (
                    <SelectItem key={a.id} value={a.id} className="text-[12px]">
                      <span className="font-mono text-[11px]">{a.asset.assetTag}</span> — {a.employee.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-[11px] font-semibold text-gray-600">Condition</Label>
                <Select value={condition} onValueChange={setCondition}>
                  <SelectTrigger className="mt-1 h-9 text-[12.5px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['Excellent', 'Good', 'Fair', 'Poor'].map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[11px] font-semibold text-gray-600">Reason</Label>
                <Select value={reason} onValueChange={setReason}>
                  <SelectTrigger className="mt-1 h-9 text-[12.5px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['Routine Swap', 'Upgrade Cycle', 'Project Closure', 'Role Change', 'Resignation'].map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <label className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-gray-200 px-3 py-2.5">
              <Checkbox checked={markRepair} onCheckedChange={(v) => setMarkRepair(v === true)} className="h-3.5 w-3.5" />
              <span className="text-[12px] text-gray-600">Route directly to repair (RMA intake)</span>
            </label>
            <Button onClick={submit} disabled={saving} className="h-9 w-full rounded-lg bg-blue-600 text-[12.5px] font-semibold text-white hover:bg-blue-700">
              {saving ? 'Processing…' : 'Process Return'}
            </Button>
            <p className="text-[10.5px] leading-relaxed text-gray-400">
              A return ID (RET-YYYY-XXXXX) is minted, the assignment closes, and the asset either re-enters the in-stock pool or opens a repair case.
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-[12.5px] font-bold text-gray-800">Return History</h3>
              <p className="text-[10.5px] text-gray-400">Verified restocks with condition outcomes</p>
            </div>
          </div>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/70">
                  {['RETURN ID', 'ASSET', 'RETURNED BY', 'RETURNED AT', 'CONDITION', 'REASON', 'PROCESSED BY'].map((h) => (
                    <th key={h} className="px-3 py-2.5 text-left text-[9.5px] font-bold tracking-wide text-gray-500 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading && !data ? (
                  <tr><td colSpan={7} className="py-10 text-center text-xs text-gray-400">Loading returns…</td></tr>
                ) : data?.returns.length ? (
                  data.returns.map((r) => (
                    <tr key={r.id} className="border-b border-gray-100 last:border-0 hover:bg-blue-50/30">
                      <td className="px-3 py-2.5 font-mono text-[11px] text-gray-500">{r.returnId}</td>
                      <td className="px-3 py-2.5">
                        <span className="block font-mono text-[11px] font-semibold text-blue-700">{r.assignment.asset.assetTag}</span>
                        <span className="text-[10.5px] text-gray-500">{r.assignment.asset.name}</span>
                      </td>
                      <td className="px-3 py-2.5 text-[11.5px] text-gray-700">{r.assignment.employee.name}</td>
                      <td className="px-3 py-2.5 text-[11px] text-gray-500">{ist(r.returnedAt, false)}</td>
                      <td className="px-3 py-2.5">
                        <span className={`text-[11.5px] font-medium ${r.condition === 'Poor' ? 'text-rose-600' : r.condition === 'Fair' ? 'text-amber-600' : 'text-emerald-600'}`}>{r.condition}</span>
                      </td>
                      <td className="px-3 py-2.5 text-[11.5px] text-gray-600">{r.reason}</td>
                      <td className="px-3 py-2.5">
                        <span className="block text-[11.5px] text-gray-600">{r.processedBy}</span>
                        <StatusPill status={r.condition === 'Poor' ? 'OPEN' : 'RESOLVED'} />
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan={7} className="py-10 text-center text-xs text-gray-400">No returns recorded yet.</td></tr>
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
