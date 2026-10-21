'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useApp, useFetch } from '@/lib/store'
import { useToast } from '@/hooks/use-toast'
import { HW_CATEGORIES } from '@/lib/constants'

export function AddAssetDialog() {
  const { dialog, closeDialog, scope, bumpRefresh } = useApp()
  const open = dialog === 'add-asset'
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: '', category: 'Laptop', brand: '', serialNumber: '', purchaseCost: '',
    purchaseDate: '', warrantyEnd: '', location: 'HQ — Mumbai', notes: '',
  })

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }))

  async function submit() {
    if (!form.name.trim() || !form.category) {
      toast({ title: 'Missing fields', description: 'Asset name and category are required.', variant: 'destructive' })
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, company: scope }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      toast({ title: 'Asset registered', description: `${data.asset.assetTag} added to master inventory.` })
      closeDialog()
      bumpRefresh()
      setForm({ name: '', category: 'Laptop', brand: '', serialNumber: '', purchaseCost: '', purchaseDate: '', warrantyEnd: '', location: 'HQ — Mumbai', notes: '' })
    } catch (e) {
      toast({ title: 'Could not register asset', description: e instanceof Error ? e.message : 'Unknown error', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && closeDialog()}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="text-[15px]">Register New Asset</DialogTitle>
          <DialogDescription className="text-xs">
            The asset is checksummed into the audit stream on registration and receives an auto-generated tag.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3.5 py-1">
          <div className="col-span-2">
            <Label className="text-[11px] font-semibold text-gray-600">Asset Name *</Label>
            <Input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Dell XPS 15 9530" className="mt-1 h-8.5 text-[12.5px]" />
          </div>
          <div>
            <Label className="text-[11px] font-semibold text-gray-600">Hardware Category *</Label>
            <Select value={form.category} onValueChange={(v) => set('category', v)}>
              <SelectTrigger className="mt-1 h-8.5 text-[12.5px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {HW_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-[11px] font-semibold text-gray-600">Brand</Label>
            <Input value={form.brand} onChange={(e) => set('brand', e.target.value)} placeholder="Dell" className="mt-1 h-8.5 text-[12.5px]" />
          </div>
          <div>
            <Label className="text-[11px] font-semibold text-gray-600">Serial Number</Label>
            <Input value={form.serialNumber} onChange={(e) => set('serialNumber', e.target.value)} placeholder="Auto if blank" className="mt-1 h-8.5 text-[12.5px]" />
          </div>
          <div>
            <Label className="text-[11px] font-semibold text-gray-600">Purchase Cost (USD)</Label>
            <Input type="number" value={form.purchaseCost} onChange={(e) => set('purchaseCost', e.target.value)} placeholder="1500" className="mt-1 h-8.5 text-[12.5px]" />
          </div>
          <div>
            <Label className="text-[11px] font-semibold text-gray-600">Purchase Date</Label>
            <Input type="date" value={form.purchaseDate} onChange={(e) => set('purchaseDate', e.target.value)} className="mt-1 h-8.5 text-[12.5px]" />
          </div>
          <div>
            <Label className="text-[11px] font-semibold text-gray-600">Warranty End</Label>
            <Input type="date" value={form.warrantyEnd} onChange={(e) => set('warrantyEnd', e.target.value)} className="mt-1 h-8.5 text-[12.5px]" />
          </div>
          <div>
            <Label className="text-[11px] font-semibold text-gray-600">Location</Label>
            <Input value={form.location} onChange={(e) => set('location', e.target.value)} className="mt-1 h-8.5 text-[12.5px]" />
          </div>
          <div className="col-span-2">
            <Label className="text-[11px] font-semibold text-gray-600">Notes</Label>
            <Textarea value={form.notes} onChange={(e) => set('notes', e.target.value)} placeholder="Accessory bundle, insured value, etc." className="mt-1 min-h-[60px] text-[12.5px]" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={closeDialog}>Cancel</Button>
          <Button size="sm" onClick={submit} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
            {saving ? 'Registering…' : 'Register Asset'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function AssignDialog() {
  const { dialog, closeDialog, scope, bumpRefresh } = useApp()
  const open = dialog === 'assign'
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)
  const [assetId, setAssetId] = useState('')
  const [employeeId, setEmployeeId] = useState('')
  const [expected, setExpected] = useState('')

  const { data: stock } = useFetch<{ assets: { id: string; assetTag: string; name: string }[] }>(
    open ? `/api/assets?company=${scope}&status=IN_STOCK&pageSize=100` : null
  )
  const { data: emps } = useFetch<{ employees: { id: string; name: string; department: string; empCode: string }[] }>(
    open ? `/api/employees?company=${scope}` : null
  )

  async function submit() {
    if (!assetId || !employeeId) {
      toast({ title: 'Missing fields', description: 'Select both an in-stock asset and an employee.', variant: 'destructive' })
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assetId, employeeId, expectedReturnAt: expected || undefined }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      toast({ title: 'Custody assigned', description: `Handover receipt ${data.assignment.receiptId} signed & logged.` })
      closeDialog()
      bumpRefresh()
      setAssetId(''); setEmployeeId(''); setExpected('')
    } catch (e) {
      toast({ title: 'Could not assign', description: e instanceof Error ? e.message : 'Unknown error', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && closeDialog()}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle className="text-[15px]">Assign Asset — Signed Handover</DialogTitle>
          <DialogDescription className="text-xs">
            Generates a handover receipt, sets the asset to Assigned and stamps the audit trail.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3.5 py-1">
          <div>
            <Label className="text-[11px] font-semibold text-gray-600">In-stock Asset *</Label>
            <Select value={assetId} onValueChange={setAssetId}>
              <SelectTrigger className="mt-1 h-8.5 text-[12.5px]"><SelectValue placeholder="Select asset" /></SelectTrigger>
              <SelectContent className="max-h-60">
                {(stock?.assets ?? []).map((a) => (
                  <SelectItem key={a.id} value={a.id} className="text-[12.5px]">
                    <span className="font-mono text-[11px]">{a.assetTag}</span> — {a.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-[11px] font-semibold text-gray-600">Employee *</Label>
            <Select value={employeeId} onValueChange={setEmployeeId}>
              <SelectTrigger className="mt-1 h-8.5 text-[12.5px]"><SelectValue placeholder="Select employee" /></SelectTrigger>
              <SelectContent className="max-h-60">
                {(emps?.employees ?? []).map((e) => (
                  <SelectItem key={e.id} value={e.id} className="text-[12.5px]">
                    {e.name} — {e.department}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-[11px] font-semibold text-gray-600">Expected Return Date</Label>
            <Input type="date" value={expected} onChange={(e) => setExpected(e.target.value)} className="mt-1 h-8.5 text-[12.5px]" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={closeDialog}>Cancel</Button>
          <Button size="sm" onClick={submit} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
            {saving ? 'Assigning…' : 'Assign Custody'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function ReturnDialog() {
  const { dialog, closeDialog, scope, bumpRefresh } = useApp()
  const open = dialog === 'return'
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)
  const [assignmentId, setAssignmentId] = useState('')
  const [condition, setCondition] = useState('Good')
  const [reason, setReason] = useState('Routine Swap')
  const [markRepair, setMarkRepair] = useState(false)

  const { data: active } = useFetch<{ assignments: { id: string; receiptId: string; asset: { assetTag: string; name: string }; employee: { name: string } }[] }>(
    open ? `/api/assignments?company=${scope}&status=ACTIVE&pageSize=100` : null
  )

  async function submit() {
    if (!assignmentId) {
      toast({ title: 'Missing fields', description: 'Select an active assignment to close.', variant: 'destructive' })
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/returns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignmentId, condition, reason, markRepair }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      toast({ title: 'Return processed', description: `${data.return.returnId} — custody closed & asset restocked.` })
      closeDialog()
      bumpRefresh()
      setAssignmentId(''); setMarkRepair(false)
    } catch (e) {
      toast({ title: 'Could not process return', description: e instanceof Error ? e.message : 'Unknown error', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && closeDialog()}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle className="text-[15px]">Process Asset Return</DialogTitle>
          <DialogDescription className="text-xs">
            Closes the active custody, verifies condition and restocks or routes to repair.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3.5 py-1">
          <div>
            <Label className="text-[11px] font-semibold text-gray-600">Active Assignment *</Label>
            <Select value={assignmentId} onValueChange={setAssignmentId}>
              <SelectTrigger className="mt-1 h-8.5 text-[12.5px]"><SelectValue placeholder="Select assignment" /></SelectTrigger>
              <SelectContent className="max-h-60">
                {(active?.assignments ?? []).map((a) => (
                  <SelectItem key={a.id} value={a.id} className="text-[12.5px]">
                    <span className="font-mono text-[11px]">{a.asset.assetTag}</span> — {a.employee.name} ({a.receiptId})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-[11px] font-semibold text-gray-600">Condition on Return</Label>
              <Select value={condition} onValueChange={setCondition}>
                <SelectTrigger className="mt-1 h-8.5 text-[12.5px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['Excellent', 'Good', 'Fair', 'Poor'].map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[11px] font-semibold text-gray-600">Return Reason</Label>
              <Select value={reason} onValueChange={setReason}>
                <SelectTrigger className="mt-1 h-8.5 text-[12.5px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['Routine Swap', 'Upgrade Cycle', 'Project Closure', 'Role Change', 'Resignation'].map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-gray-200 px-3 py-2.5">
            <input type="checkbox" checked={markRepair} onChange={(e) => setMarkRepair(e.target.checked)} className="h-3.5 w-3.5 accent-blue-600" />
            <span className="text-[12px] text-gray-600">Route directly to repair (RMA intake)</span>
          </label>
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={closeDialog}>Cancel</Button>
          <Button size="sm" onClick={submit} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
            {saving ? 'Processing…' : 'Process Return'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
