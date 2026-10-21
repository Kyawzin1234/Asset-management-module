'use client'

import { useState } from 'react'
import { Store, Plus, Star, Mail, Phone, MapPin, Trash2 } from 'lucide-react'
import { useApp, useFetch } from '@/lib/store'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PageHeader } from '@/components/app/shared'
import { useToast } from '@/hooks/use-toast'

type Vendor = {
  id: string; name: string; category: string | null; contact: string | null
  email: string | null; phone: string | null; address: string | null; rating: number
  _count: { repairs: number; licenses: number }
}

export function VendorsView() {
  const { scope, refreshKey, bumpRefresh } = useApp()
  const { toast } = useToast()
  const [q, setQ] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: '', category: 'Hardware', contact: '', email: '', phone: '', address: '' })
  const [delTarget, setDelTarget] = useState<Vendor | null>(null)
  const [deleting, setDeleting] = useState(false)

  const { data, loading } = useFetch<{ vendors: Vendor[] }>(`/api/vendors?company=${scope}&q=${encodeURIComponent(q)}`, [refreshKey])

  async function addVendor() {
    if (!form.name.trim()) {
      toast({ title: 'Missing fields', description: 'Vendor name is required.', variant: 'destructive' })
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/vendors', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, company: scope }),
      })
      if (!res.ok) throw new Error()
      toast({ title: 'Vendor added', description: `${form.name} is now part of the partner directory.` })
      setAddOpen(false)
      setForm({ name: '', category: 'Hardware', contact: '', email: '', phone: '', address: '' })
      bumpRefresh()
    } catch {
      toast({ title: 'Could not add vendor', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  async function removeVendor(v: Vendor) {
    setDeleting(true)
    try {
      const res = await fetch('/api/vendors/' + v.id, { method: 'DELETE' })
      const d = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast({ title: 'Cannot delete vendor', description: d.error, variant: 'destructive' })
        return
      }
      toast({ title: `${v.name} removed`, description: 'Linked RMA cases and license pools were kept but unlinked.' })
      setDelTarget(null)
      bumpRefresh()
    } catch {
      toast({ title: 'Could not delete vendor', variant: 'destructive' })
    } finally {
      setDeleting(false)
    }
  }

  const catCls: Record<string, string> = {
    Hardware: 'bg-blue-50 text-blue-700',
    Software: 'bg-violet-50 text-violet-700',
    Service: 'bg-emerald-50 text-emerald-700',
  }

  return (
    <div className="mx-auto max-w-[1400px]">
      <PageHeader
        breadcrumb={['Lifecycle & Reference', 'Vendors & Brands']}
        title="Vendor & Brand Directory"
        subtitle="Hardware OEMs, software publishers and service partners — RMA cases and license pools link back to these records."
        actions={
          <Button size="sm" onClick={() => setAddOpen(true)} className="h-9 gap-1.5 rounded-lg bg-blue-600 text-[12.5px] font-semibold text-white hover:bg-blue-700">
            <Plus className="h-3.5 w-3.5" /> Add Vendor
          </Button>
        }
      />

      <div className="relative mb-4 max-w-md">
        <Store className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search vendors…" className="h-9 pl-9 text-[12.5px]" />
      </div>

      {loading && !data ? (
        <p className="py-16 text-center text-sm text-gray-400">Loading vendors…</p>
      ) : (
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {(data?.vendors ?? []).map((v) => (
            <div key={v.id} className="rounded-xl border border-gray-200 bg-white p-4 transition-all hover:border-blue-200 hover:shadow-[0_2px_10px_rgba(21,112,239,0.06)]">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 text-[11px] font-bold text-gray-600">
                    {v.name.slice(0, 2).toUpperCase()}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-bold text-gray-900">{v.name}</p>
                    <span className={`inline-block rounded-md px-1.5 py-0.5 text-[9.5px] font-bold ${catCls[v.category ?? ''] ?? 'bg-gray-100 text-gray-500'}`}>
                      {v.category ?? 'Partner'}
                    </span>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <span className="flex items-center gap-0.5 rounded-md bg-amber-50 px-1.5 py-0.5 text-[10.5px] font-bold text-amber-600">
                    <Star className="h-3 w-3 fill-amber-500 text-amber-500" /> {v.rating.toFixed(1)}
                  </span>
                  <button
                    onClick={() => setDelTarget(v)}
                    title="Delete vendor"
                    aria-label={`Delete vendor ${v.name}`}
                    className="rounded-md p-1.5 text-gray-300 transition-colors hover:bg-rose-50 hover:text-rose-600"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              <div className="mt-3 space-y-1.5 border-t border-gray-100 pt-2.5 text-[10.5px] text-gray-500">
                <p className="flex items-center gap-1.5 truncate"><Mail className="h-3 w-3 text-gray-400" />{v.email ?? '—'}</p>
                <p className="flex items-center gap-1.5 truncate"><Phone className="h-3 w-3 text-gray-400" />{v.phone ?? '—'}</p>
                <p className="flex items-center gap-1.5 truncate"><MapPin className="h-3 w-3 text-gray-400" />{v.address ?? '—'}</p>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <div className="rounded-lg bg-rose-50/70 p-2 text-center">
                  <p className="text-[14px] font-bold text-rose-600">{v._count.repairs}</p>
                  <p className="text-[9px] font-semibold uppercase tracking-wide text-rose-400">RMA Cases</p>
                </div>
                <div className="rounded-lg bg-violet-50/70 p-2 text-center">
                  <p className="text-[14px] font-bold text-violet-600">{v._count.licenses}</p>
                  <p className="text-[9px] font-semibold uppercase tracking-wide text-violet-400">Licenses</p>
                </div>
              </div>
            </div>
          ))}
          {!(data?.vendors ?? []).length ? (
            <p className="col-span-full py-14 text-center text-sm text-gray-400">No vendors match the search.</p>
          ) : null}
        </div>
      )}

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-[460px]">
          <DialogHeader>
            <DialogTitle className="text-[15px]">Add Vendor Partner</DialogTitle>
            <DialogDescription className="text-xs">Vendors anchor repair RMAs and license pools within the scoped company.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3.5 py-1">
            <div className="col-span-2">
              <Label className="text-[11px] font-semibold text-gray-600">Vendor Name *</Label>
              <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Canon Business Services" className="mt-1 h-9 text-[12.5px]" />
            </div>
            <div>
              <Label className="text-[11px] font-semibold text-gray-600">Category</Label>
              <Select value={form.category} onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}>
                <SelectTrigger className="mt-1 h-9 text-[12.5px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['Hardware', 'Software', 'Service'].map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[11px] font-semibold text-gray-600">Contact Person</Label>
              <Input value={form.contact} onChange={(e) => setForm((f) => ({ ...f, contact: e.target.value }))} className="mt-1 h-9 text-[12.5px]" />
            </div>
            <div>
              <Label className="text-[11px] font-semibold text-gray-600">Email</Label>
              <Input value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} className="mt-1 h-9 text-[12.5px]" />
            </div>
            <div>
              <Label className="text-[11px] font-semibold text-gray-600">Phone</Label>
              <Input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} className="mt-1 h-9 text-[12.5px]" />
            </div>
            <div className="col-span-2">
              <Label className="text-[11px] font-semibold text-gray-600">Address</Label>
              <Input value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} className="mt-1 h-9 text-[12.5px]" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={addVendor} disabled={saving} className="bg-blue-600 hover:bg-blue-700">{saving ? 'Saving…' : 'Add Vendor'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!delTarget} onOpenChange={(o) => !o && setDelTarget(null)}>
        <AlertDialogContent className="sm:max-w-[440px]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[15px]">Delete vendor “{delTarget?.name}”?</AlertDialogTitle>
            <AlertDialogDescription className="text-xs">
              This removes the partner record from the directory. {delTarget?._count.repairs ?? 0} RMA case(s) and{' '}
              {delTarget?._count.licenses ?? 0} license pool(s) will be kept but unlinked. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-9 text-xs">Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleting}
              onClick={(e) => { e.preventDefault(); if (delTarget) removeVendor(delTarget) }}
              className="h-9 bg-rose-600 text-xs hover:bg-rose-700"
            >
              {deleting ? 'Deleting…' : 'Delete vendor'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
