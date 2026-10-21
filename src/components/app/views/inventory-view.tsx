'use client'

import { useState } from 'react'
import { Package, Search, Plus, MoreHorizontal, Wrench, Archive, Trash2, FileOutput } from 'lucide-react'
import { useApp, useFetch } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { KpiCard, PageHeader, Pagination, StatusPill, dateOnly } from '@/components/app/shared'
import { useToast } from '@/hooks/use-toast'
import { HW_CATEGORIES, ASSET_STATUSES } from '@/lib/constants'

type Asset = {
  id: string; assetTag: string; name: string; category: string; brand: string | null
  serialNumber: string | null; status: string; condition: string; purchaseCost: number
  purchaseDate: string | null; warrantyEnd: string | null; location: string | null
  assignments: { employee: { name: string; department: string } }[]
}

type AssetsResp = {
  assets: Asset[]; total: number; page: number; pageSize: number
  counts: Record<string, number>; categories: string[]
}

export function InventoryView() {
  const { scope, openDialog, refreshKey, bumpRefresh } = useApp()
  const { toast } = useToast()
  const [q, setQ] = useState('')
  const [category, setCategory] = useState('ALL')
  const [status, setStatus] = useState('ALL')
  const [page, setPage] = useState(1)

  const url = `/api/assets?company=${scope}&q=${encodeURIComponent(q)}&category=${category}&status=${status}&page=${page}&pageSize=10`
  const { data, loading } = useFetch<AssetsResp>(url, [refreshKey])

  async function patchAsset(id: string, body: Record<string, unknown>, okMsg: string) {
    const res = await fetch('/api/assets/' + id, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    })
    const d = await res.json()
    if (!res.ok) {
      toast({ title: 'Action failed', description: d.error, variant: 'destructive' })
      return
    }
    toast({ title: okMsg })
    bumpRefresh()
  }

  async function removeAsset(id: string, tag: string) {
    const res = await fetch('/api/assets/' + id, { method: 'DELETE' })
    const d = await res.json()
    if (!res.ok) {
      toast({ title: 'Cannot delete', description: d.error, variant: 'destructive' })
      return
    }
    toast({ title: `${tag} removed from inventory` })
    bumpRefresh()
  }

  const c = data?.counts ?? {}

  return (
    <div className="mx-auto max-w-[1400px]">
      <PageHeader
        breadcrumb={['Asset Registry', 'Inventory Master']}
        title="Current Inventory Master"
        subtitle="Master hardware list with serial tags, condition grades, purchase costs and company ownership — the source of truth for every downstream report."
        actions={
          <Button size="sm" onClick={() => openDialog('add-asset')} className="h-9 gap-1.5 rounded-lg bg-blue-600 text-[12.5px] font-semibold text-white hover:bg-blue-700">
            <Plus className="h-3.5 w-3.5" /> Add Asset
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3.5 xl:grid-cols-4">
        <KpiCard label="IN STOCK / AVAILABLE" value={(c.IN_STOCK ?? 0).toLocaleString('en-US')} sub="Ready for handover" subTone="green" />
        <KpiCard label="ASSIGNED" value={(c.ASSIGNED ?? 0).toLocaleString('en-US')} sub="Active custody" subTone="violet" />
        <KpiCard label="UNDER REPAIR" value={(c.REPAIR ?? 0).toLocaleString('en-US')} sub="RMA / vendor tickets" subTone="red" />
        <KpiCard label="RETIRED" value={(c.RETIRED ?? 0).toLocaleString('en-US')} sub="Out of active scope" subTone="neutral" />
      </div>

      <div className="mt-4 rounded-xl border border-gray-200 bg-white p-4">
        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
            <Input
              value={q}
              onChange={(e) => { setQ(e.target.value); setPage(1) }}
              placeholder="Search asset tag, model or serial number…"
              className="h-9 border-gray-200 pl-9 text-[12.5px]"
            />
          </div>
          <Select value={category} onValueChange={(v) => { setCategory(v); setPage(1) }}>
            <SelectTrigger className="h-9 w-full text-[12px] sm:w-[170px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL" className="text-[12px]">All Categories</SelectItem>
              {HW_CATEGORIES.map((x) => <SelectItem key={x} value={x} className="text-[12px]">{x}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1) }}>
            <SelectTrigger className="h-9 w-full text-[12px] sm:w-[170px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {ASSET_STATUSES.map((s) => <SelectItem key={s.value} value={s.value} className="text-[12px]">{s.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[900px] border-collapse">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/70">
                {['ASSET TAG', 'MODEL', 'CATEGORY', 'STATUS', 'CONDITION', 'CUSTODIAN', 'WARRANTY END', 'COST', ''].map((h) => (
                  <th key={h} className="px-3 py-2.5 text-left text-[9.5px] font-bold tracking-wide text-gray-500 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && !data ? (
                <tr><td colSpan={9} className="py-10 text-center text-xs text-gray-400">Loading inventory…</td></tr>
              ) : data?.assets.length ? (
                data.assets.map((a) => (
                  <tr key={a.id} className="border-b border-gray-100 transition-colors last:border-0 hover:bg-blue-50/30">
                    <td className="px-3 py-2.5 font-mono text-[11px] font-semibold text-blue-700">{a.assetTag}</td>
                    <td className="px-3 py-2.5 text-[11.5px] text-gray-700">
                      <span className="block font-medium text-gray-800">{a.name}</span>
                      <span className="text-[10px] text-gray-400">{a.serialNumber} · {a.location}</span>
                    </td>
                    <td className="px-3 py-2.5 text-[11.5px] text-gray-600">{a.category}</td>
                    <td className="px-3 py-2.5"><StatusPill status={a.status} /></td>
                    <td className="px-3 py-2.5">
                      <span className={`text-[11.5px] font-medium ${a.condition === 'Poor' ? 'text-rose-600' : a.condition === 'Fair' ? 'text-amber-600' : 'text-emerald-600'}`}>{a.condition}</span>
                    </td>
                    <td className="px-3 py-2.5 text-[11.5px] text-gray-600">{a.assignments[0]?.employee?.name ?? <span className="text-gray-300">Unassigned</span>}</td>
                    <td className="px-3 py-2.5 text-[11.5px] text-gray-500">{dateOnly(a.warrantyEnd)}</td>
                    <td className="px-3 py-2.5 text-[11.5px] font-medium text-gray-700">${a.purchaseCost.toLocaleString('en-US')}</td>
                    <td className="px-3 py-2.5 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                            <MoreHorizontal className="h-4 w-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                          <DropdownMenuItem className="text-xs gap-2" disabled={a.status !== 'IN_STOCK'} onClick={() => openDialog('assign')}>
                            <FileOutput className="h-3.5 w-3.5" /> Assign custody
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-xs gap-2" disabled={a.status === 'REPAIR'} onClick={() => patchAsset(a.id, { status: 'REPAIR' }, 'Flagged for repair — RMA intake logged')}>
                            <Wrench className="h-3.5 w-3.5" /> Flag for repair
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-xs gap-2" disabled={a.status === 'IN_STOCK'} onClick={() => patchAsset(a.id, { status: 'IN_STOCK' }, 'Restocked to in-stock')}>
                            <Archive className="h-3.5 w-3.5" /> Restock
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-xs gap-2 text-rose-600" disabled={a.status === 'ASSIGNED'} onClick={() => removeAsset(a.id, a.assetTag)}>
                            <Trash2 className="h-3.5 w-3.5" /> Delete record
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={9} className="py-10 text-center text-xs text-gray-400">No assets match the filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        {data ? <Pagination page={data.page} pageSize={data.pageSize} total={data.total} onPage={setPage} /> : null}
      </div>
    </div>
  )
}
