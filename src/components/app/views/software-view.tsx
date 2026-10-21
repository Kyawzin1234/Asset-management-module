'use client'

import { useState } from 'react'
import { Search, ShieldCheck, Plus, KeyRound, Trash2 } from 'lucide-react'
import { useApp, useFetch } from '@/lib/store'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { KpiCard, PageHeader, dateOnly } from '@/components/app/shared'
import { useToast } from '@/hooks/use-toast'

type Lic = {
  id: string; name: string; licenseKey: string | null; seats: number; seatsUsed: number
  type: string; expiresAt: string | null; costPerSeat: number
  vendor: { id: string; name: string } | null
}
type LicResp = { licenses: Lic[]; total: number; vendors: { id: string; name: string }[] }

function daysLeft(iso: string | null): number | null {
  if (!iso) return null
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000)
}

export function SoftwareView() {
  const { scope, refreshKey, bumpRefresh } = useApp()
  const { toast } = useToast()
  const [q, setQ] = useState('')
  const [expiringOnly, setExpiringOnly] = useState(false)
  const [addOpen, setAddOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: '', vendorId: '', seats: '50', type: 'Subscription', expiresAt: '', costPerSeat: '' })
  const [delTarget, setDelTarget] = useState<Lic | null>(null)
  const [deleting, setDeleting] = useState(false)

  const { data, loading } = useFetch<LicResp>(
    `/api/licenses?company=${scope}&q=${encodeURIComponent(q)}&expiring=${expiringOnly ? '1' : '0'}`, [refreshKey]
  )

  const list = data?.licenses ?? []
  const soon = list.filter((l) => { const d = daysLeft(l.expiresAt); return d !== null && d <= 60 && d >= 0 }).length
  const totalSeats = list.reduce((s, l) => s + l.seats, 0)
  const usedSeats = list.reduce((s, l) => s + l.seatsUsed, 0)
  const annualCost = list.reduce((s, l) => s + l.seats * l.costPerSeat, 0)

  async function addLicense() {
    if (!form.name.trim()) {
      toast({ title: 'Missing fields', description: 'License name is required.', variant: 'destructive' })
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/licenses', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, company: scope, seats: Number(form.seats), costPerSeat: Number(form.costPerSeat) }),
      })
      if (!res.ok) throw new Error()
      toast({ title: 'License added', description: `${form.name} is now tracked with expiry monitoring.` })
      setAddOpen(false)
      setForm({ name: '', vendorId: '', seats: '50', type: 'Subscription', expiresAt: '', costPerSeat: '' })
      bumpRefresh()
    } catch {
      toast({ title: 'Could not add license', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  async function removeLicense(l: Lic) {
    setDeleting(true)
    try {
      const res = await fetch('/api/licenses/' + l.id, { method: 'DELETE' })
      const d = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast({ title: 'Cannot delete license', description: d.error, variant: 'destructive' })
        return
      }
      toast({ title: `${l.name} removed`, description: 'License pool closed and seats released.' })
      setDelTarget(null)
      bumpRefresh()
    } catch {
      toast({ title: 'Could not delete license', variant: 'destructive' })
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="mx-auto max-w-[1400px]">
      <PageHeader
        breadcrumb={['Lifecycle & Reference', 'Software & Expiry']}
        title="Software Licenses & Expiry Timelines"
        subtitle="Subscription seats, license keys and expiration surveillance — alerts fire inside a 60-day window, feeding the Lifecycle report."
        actions={
          <Button size="sm" onClick={() => setAddOpen(true)} className="h-9 gap-1.5 rounded-lg bg-blue-600 text-[12.5px] font-semibold text-white hover:bg-blue-700">
            <Plus className="h-3.5 w-3.5" /> Add License
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3.5 xl:grid-cols-4">
        <KpiCard label="TRACKED LICENSES" value={list.length} sub={`${totalSeats.toLocaleString('en-US')} seats pooled`} subTone="neutral" />
        <KpiCard label="SEATS UTILIZED" value={usedSeats.toLocaleString('en-US')} sub={`${totalSeats ? Math.round((usedSeats / totalSeats) * 100) : 0}% of pooled seats`} subTone="violet" />
        <KpiCard label="EXPIRING ≤ 60 DAYS" value={soon} sub="Renewal window open" subTone="amber" />
        <KpiCard label="ANNUAL LICENSE SPEND" value={'$' + annualCost.toLocaleString('en-US')} sub="Seats × per-seat cost" subTone="green" />
      </div>

      <div className="mt-4 rounded-xl border border-gray-200 bg-white p-4">
        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search license name or vendor…" className="h-9 pl-9 text-[12.5px]" />
          </div>
          <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-gray-200 px-3 py-2">
            <input type="checkbox" checked={expiringOnly} onChange={(e) => setExpiringOnly(e.target.checked)} className="h-3.5 w-3.5 accent-amber-500" />
            <span className="text-[12px] font-medium text-gray-600">Expiring within 90 days</span>
          </label>
        </div>

        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[880px] border-collapse">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/70">
                {['LICENSE', 'VENDOR', 'TYPE', 'SEAT UTILIZATION', 'KEY', 'EXPIRY', 'STATUS', ''].map((h) => (
                  <th key={h} className="px-3 py-2.5 text-left text-[9.5px] font-bold tracking-wide text-gray-500 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && !data ? (
                <tr><td colSpan={8} className="py-10 text-center text-xs text-gray-400">Loading licenses…</td></tr>
              ) : list.length ? (
                list.map((l) => {
                  const d = daysLeft(l.expiresAt)
                  const expired = d !== null && d < 0
                  const soonFlag = d !== null && d <= 60
                  const pct = l.seats ? Math.round((l.seatsUsed / l.seats) * 100) : 0
                  return (
                    <tr key={l.id} className="border-b border-gray-100 last:border-0 hover:bg-blue-50/30">
                      <td className="px-3 py-2.5">
                        <span className="block text-[12px] font-semibold text-gray-800">{l.name}</span>
                        <span className="text-[10px] text-gray-400">${l.costPerSeat}/seat/yr</span>
                      </td>
                      <td className="px-3 py-2.5 text-[11.5px] text-gray-600">{l.vendor?.name ?? '—'}</td>
                      <td className="px-3 py-2.5"><span className="rounded-md bg-gray-100 px-1.5 py-0.5 text-[10px] font-bold text-gray-500">{l.type}</span></td>
                      <td className="px-3 py-2.5">
                        <div className="w-[130px]">
                          <div className="flex justify-between text-[10px] text-gray-500"><span>{l.seatsUsed}/{l.seats}</span><span>{pct}%</span></div>
                          <Progress value={pct} className="mt-0.5 h-1.5" />
                        </div>
                      </td>
                      <td className="px-3 py-2.5 font-mono text-[10px] text-gray-400">
                        <span className="inline-flex items-center gap-1"><KeyRound className="h-3 w-3" />{l.licenseKey ?? '—'}</span>
                      </td>
                      <td className="px-3 py-2.5 text-[11.5px] text-gray-600">{dateOnly(l.expiresAt)}</td>
                      <td className="px-3 py-2.5">
                        {d === null ? (
                          <span className="rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-[10px] font-semibold text-gray-500">Perpetual</span>
                        ) : expired ? (
                          <span className="rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-[10px] font-semibold text-rose-600">Expired</span>
                        ) : soonFlag ? (
                          <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-600">{d} days left</span>
                        ) : (
                          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-600">{d} days left</span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        <button
                          onClick={() => setDelTarget(l)}
                          title="Delete license"
                          aria-label={`Delete license ${l.name}`}
                          className="rounded-md p-1.5 text-gray-300 transition-colors hover:bg-rose-50 hover:text-rose-600"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr><td colSpan={8} className="py-10 text-center text-xs text-gray-400">No licenses found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="text-[15px]">Track New Software License</DialogTitle>
            <DialogDescription className="text-xs">Seats and expiry feed the Lifecycle badge and Expiry & Warranty report.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3.5 py-1">
            <div className="col-span-2">
              <Label className="text-[11px] font-semibold text-gray-600">License Name *</Label>
              <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Figma Organization" className="mt-1 h-9 text-[12.5px]" />
            </div>
            <div>
              <Label className="text-[11px] font-semibold text-gray-600">Vendor</Label>
              <Select value={form.vendorId || 'NONE'} onValueChange={(v) => setForm((f) => ({ ...f, vendorId: v === 'NONE' ? '' : v }))}>
                <SelectTrigger className="mt-1 h-9 text-[12.5px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="NONE">Unassigned</SelectItem>
                  {(data?.vendors ?? []).map((v) => <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[11px] font-semibold text-gray-600">Type</Label>
              <Select value={form.type} onValueChange={(v) => setForm((f) => ({ ...f, type: v }))}>
                <SelectTrigger className="mt-1 h-9 text-[12.5px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['Subscription', 'Perpetual', 'OEM'].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[11px] font-semibold text-gray-600">Seats</Label>
              <Input type="number" value={form.seats} onChange={(e) => setForm((f) => ({ ...f, seats: e.target.value }))} className="mt-1 h-9 text-[12.5px]" />
            </div>
            <div>
              <Label className="text-[11px] font-semibold text-gray-600">Cost per Seat (USD)</Label>
              <Input type="number" value={form.costPerSeat} onChange={(e) => setForm((f) => ({ ...f, costPerSeat: e.target.value }))} className="mt-1 h-9 text-[12.5px]" />
            </div>
            <div className="col-span-2">
              <Label className="text-[11px] font-semibold text-gray-600">Expiry Date</Label>
              <Input type="date" value={form.expiresAt} onChange={(e) => setForm((f) => ({ ...f, expiresAt: e.target.value }))} className="mt-1 h-9 text-[12.5px]" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={addLicense} disabled={saving} className="bg-blue-600 hover:bg-blue-700">{saving ? 'Saving…' : 'Add License'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!delTarget} onOpenChange={(o) => !o && setDelTarget(null)}>
        <AlertDialogContent className="sm:max-w-[440px]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[15px]">Delete license “{delTarget?.name}”?</AlertDialogTitle>
            <AlertDialogDescription className="text-xs">
              This closes the license pool and releases {delTarget?.seats ?? 0} seat(s). Expiry alerts will stop for this
              record. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-9 text-xs">Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleting}
              onClick={(e) => { e.preventDefault(); if (delTarget) removeLicense(delTarget) }}
              className="h-9 bg-rose-600 text-xs hover:bg-rose-700"
            >
              {deleting ? 'Deleting…' : 'Delete license'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="mt-4 flex items-center gap-2 rounded-xl border border-blue-100 bg-blue-50/60 p-3.5">
        <ShieldCheck className="h-4 w-4 shrink-0 text-blue-600" />
        <p className="text-[11.5px] leading-relaxed text-blue-700/80">
          Licenses inside the 60-day window are automatically counted into the <span className="font-semibold">Warranty & Expiry Alerts</span> KPI and surface in the Lifecycle standard report.
        </p>
      </div>
    </div>
  )
}
