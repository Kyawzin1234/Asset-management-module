'use client'

import { useState } from 'react'
import { ArrowLeftRight } from 'lucide-react'
import { useApp, useFetch } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PageHeader, Pagination, ist } from '@/components/app/shared'
import { useToast } from '@/hooks/use-toast'
import { DEPARTMENTS } from '@/lib/constants'

type Trf = {
  id: string; transferId: string; fromDept: string; toDept: string
  fromCompany: string | null; toCompany: string | null
  transferredAt: string; operator: string; reason: string | null
  assignment: { receiptId: string; asset: { assetTag: string; name: string } }
}
type TrfResp = { transfers: Trf[]; total: number; page: number; pageSize: number }

export function TransferView() {
  const { scope, refreshKey, bumpRefresh } = useApp()
  const { toast } = useToast()
  const [assignmentId, setAssignmentId] = useState('')
  const [toDept, setToDept] = useState('')
  const [reason, setReason] = useState('')
  const [saving, setSaving] = useState(false)
  const [page, setPage] = useState(1)

  const { data: active } = useFetch<{ assignments: { id: string; receiptId: string; asset: { assetTag: string; name: string }; employee: { name: string; department: string } }[] }>(
    `/api/assignments?company=${scope}&status=ACTIVE&pageSize=100`, [refreshKey]
  )
  const { data, loading } = useFetch<TrfResp>(`/api/transfers?company=${scope}&page=${page}&pageSize=8`, [refreshKey])

  async function submit() {
    if (!assignmentId || !toDept) {
      toast({ title: 'Missing fields', description: 'Select an active assignment and a destination department.', variant: 'destructive' })
      return
    }
    const from = active?.assignments.find((a) => a.id === assignmentId)?.employee.department
    setSaving(true)
    try {
      const res = await fetch('/api/transfers', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignmentId, toDept, fromDept: from, reason: reason || undefined }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error || 'Failed')
      toast({ title: 'Custody transferred', description: `${d.transfer.transferId} — chain-of-custody re-signed & logged.` })
      setAssignmentId(''); setToDept(''); setReason('')
      bumpRefresh()
    } catch (e) {
      toast({ title: 'Could not transfer', description: e instanceof Error ? e.message : 'Unknown error', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-[1400px]">
      <PageHeader
        breadcrumb={['Custody Operations', 'Transfer / Reassign']}
        title="Transfer History & Chain of Custody"
        subtitle="Inter-departmental and inter-company custody moves — every hop re-signs the chain and is permanently written to the audit lineage."
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[400px_1fr]">
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-500">
              <ArrowLeftRight className="h-[17px] w-[17px] text-white" />
            </span>
            <div>
              <h3 className="text-[12.5px] font-bold text-gray-800">New Custody Transfer</h3>
              <p className="text-[10.5px] text-gray-400">Moves custody without breaking the chain</p>
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
                      <span className="font-mono text-[11px]">{a.asset.assetTag}</span> — {a.employee.name} ({a.employee.department})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[11px] font-semibold text-gray-600">Destination Department *</Label>
              <Select value={toDept} onValueChange={setToDept}>
                <SelectTrigger className="mt-1 h-9 text-[12.5px]"><SelectValue placeholder="Select department" /></SelectTrigger>
                <SelectContent>
                  {DEPARTMENTS.map((d) => <SelectItem key={d} value={d} className="text-[12px]">{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[11px] font-semibold text-gray-600">Reason / Context</Label>
              <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Project reallocation, team move…" className="mt-1 h-9 text-[12.5px]" />
            </div>
            <Button onClick={submit} disabled={saving} className="h-9 w-full rounded-lg bg-blue-600 text-[12.5px] font-semibold text-white hover:bg-blue-700">
              {saving ? 'Transferring…' : 'Transfer Custody'}
            </Button>
            <p className="text-[10.5px] leading-relaxed text-gray-400">
              The destination ledger gains a chain reference (CHN-YYYY-XXXXX) mirroring the transfer ID for lineage audits.
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-[12.5px] font-bold text-gray-800">Transfer History Log</h3>
              <p className="text-[10.5px] text-gray-400">Every custody hop with operator & lineage reference</p>
            </div>
          </div>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[820px] border-collapse">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/70">
                  {['TRANSFER ID', 'ASSET', 'FROM', 'TO', 'OPERATOR', 'DATE', 'REASON'].map((h) => (
                    <th key={h} className="px-3 py-2.5 text-left text-[9.5px] font-bold tracking-wide text-gray-500 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading && !data ? (
                  <tr><td colSpan={7} className="py-10 text-center text-xs text-gray-400">Loading transfers…</td></tr>
                ) : data?.transfers.length ? (
                  data.transfers.map((t) => (
                    <tr key={t.id} className="border-b border-gray-100 last:border-0 hover:bg-blue-50/30">
                      <td className="px-3 py-2.5">
                        <span className="block font-mono text-[11px] text-gray-600">{t.transferId}</span>
                        <span className="font-mono text-[9.5px] text-teal-600">{t.transferId.replace('TRF', 'CHN')}</span>
                      </td>
                      <td className="px-3 py-2.5">
                        <span className="block font-mono text-[11px] font-semibold text-blue-700">{t.assignment.asset.assetTag}</span>
                        <span className="text-[10.5px] text-gray-500">{t.assignment.asset.name}</span>
                      </td>
                      <td className="px-3 py-2.5 text-[11.5px] text-gray-600">{t.fromDept}</td>
                      <td className="px-3 py-2.5 text-[11.5px] font-medium text-blue-700">{t.toDept}</td>
                      <td className="px-3 py-2.5 text-[11.5px] text-gray-600">{t.operator}</td>
                      <td className="px-3 py-2.5 text-[11px] text-gray-500">{ist(t.transferredAt, false)}</td>
                      <td className="max-w-[180px] truncate px-3 py-2.5 text-[11px] text-gray-500">{t.reason ?? '—'}</td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan={7} className="py-10 text-center text-xs text-gray-400">No transfers recorded yet.</td></tr>
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
