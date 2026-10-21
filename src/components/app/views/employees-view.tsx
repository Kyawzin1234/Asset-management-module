'use client'

import { useState } from 'react'
import { Search, Users, Mail, MapPin, Phone, Package, Trash2 } from 'lucide-react'
import { useApp, useFetch } from '@/lib/store'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { PageHeader, Pagination, StatusPill, dateOnly } from '@/components/app/shared'
import { useToast } from '@/hooks/use-toast'

type Emp = {
  id: string; empCode: string; name: string; email: string; department: string
  designation: string; location: string | null; phone: string | null
  _count: { assignments: number }
}
type EmpResp = { employees: Emp[]; total: number; departments: string[] }

type Detail = {
  employee: Emp & { company: { name: string } }
  assignments: { id: string; receiptId: string; issuedAt: string; issuedIST: string; status: string; asset: { assetTag: string; name: string; category: string; status: string } }[]
}

export function EmployeesView() {
  const { scope, refreshKey, bumpRefresh } = useApp()
  const { toast } = useToast()
  const [q, setQ] = useState('')
  const [dept, setDept] = useState('ALL')
  const [page, setPage] = useState(1)
  const [detailId, setDetailId] = useState<string | null>(null)
  const [delTarget, setDelTarget] = useState<Emp | null>(null)
  const [deleting, setDeleting] = useState(false)

  const pageSize = 12
  const { data, loading } = useFetch<EmpResp>(
    `/api/employees?company=${scope}&q=${encodeURIComponent(q)}&department=${dept}`, [refreshKey]
  )
  const { data: detail } = useFetch<Detail>(detailId ? `/api/employees/${detailId}` : null)

  const list = data?.employees ?? []
  const pageSlice = list.slice((page - 1) * pageSize, page * pageSize)

  async function removeEmployee(e: Emp) {
    setDeleting(true)
    try {
      const res = await fetch('/api/employees/' + e.id, { method: 'DELETE' })
      const d = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast({ title: 'Cannot delete employee', description: d.error, variant: 'destructive' })
        return
      }
      toast({ title: `${e.name} removed`, description: 'Employee record and custody history were purged.' })
      setDelTarget(null)
      bumpRefresh()
    } catch {
      toast({ title: 'Could not delete employee', variant: 'destructive' })
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="mx-auto max-w-[1400px]">
      <PageHeader
        breadcrumb={['People Registry', 'Employees']}
        title="Employee Directory & Asset Statements"
        subtitle="Everyone eligible for hardware custody — click a card to open their full asset statement with issuance history."
      />

      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
          <Input value={q} onChange={(e) => { setQ(e.target.value); setPage(1) }} placeholder="Search name, employee ID or email…" className="h-9 pl-9 text-[12.5px]" />
        </div>
        <Select value={dept} onValueChange={(v) => { setDept(v); setPage(1) }}>
          <SelectTrigger className="h-9 text-[12px] sm:w-[200px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL" className="text-[12px]">All Departments</SelectItem>
            {(data?.departments ?? []).map((d) => <SelectItem key={d} value={d} className="text-[12px]">{d}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {loading && !data ? (
        <p className="py-16 text-center text-sm text-gray-400">Loading directory…</p>
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {pageSlice.map((e) => (
            <div
              key={e.id}
              role="button"
              tabIndex={0}
              onClick={() => setDetailId(e.id)}
              onKeyDown={(ev) => { if (ev.key === 'Enter') setDetailId(e.id) }}
              className="relative cursor-pointer rounded-xl border border-gray-200 bg-white p-4 text-left transition-all hover:border-blue-300 hover:shadow-[0_2px_10px_rgba(21,112,239,0.08)]"
            >
              <button
                onClick={(ev) => { ev.stopPropagation(); setDelTarget(e) }}
                title="Delete employee"
                aria-label={`Delete employee ${e.name}`}
                className="absolute right-3 top-3 rounded-md p-1.5 text-gray-300 transition-colors hover:bg-rose-50 hover:text-rose-600"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-violet-700 text-[12px] font-bold text-white">
                  {e.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-bold text-gray-900">{e.name}</p>
                  <p className="truncate text-[10.5px] text-gray-400">{e.designation}</p>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-2.5">
                <span className="truncate text-[10.5px] text-gray-500">{e.department}</span>
                <span className="flex shrink-0 items-center gap-1 rounded-md bg-blue-50 px-1.5 py-0.5 text-[10.5px] font-bold text-blue-700">
                  <Package className="h-3 w-3" /> {e._count.assignments}
                </span>
              </div>
            </div>
          ))}
          {!pageSlice.length ? <p className="col-span-full py-14 text-center text-sm text-gray-400">No employees match the filters.</p> : null}
        </div>
      )}

      {data && data.employees.length > pageSize ? (
        <Pagination page={page} pageSize={pageSize} total={data.employees.length} onPage={setPage} className="mt-4" />
      ) : null}

      {/* Statement dialog */}
      <Dialog open={!!detailId} onOpenChange={(o) => !o && setDetailId(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-[640px]">
          {detail ? (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2.5 text-[15px]">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-violet-700 text-[11px] font-bold text-white">
                    {detail.employee.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                  </span>
                  {detail.employee.name} — Asset Statement
                </DialogTitle>
                <DialogDescription className="text-xs">
                  {detail.employee.designation} · {detail.employee.department} · {detail.employee.company.name}
                </DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-3 gap-2.5 rounded-xl border border-gray-100 bg-gray-50/60 p-3 text-[11px]">
                <div className="flex items-center gap-1.5 text-gray-600"><Mail className="h-3.5 w-3.5 text-gray-400" /><span className="truncate">{detail.employee.email}</span></div>
                <div className="flex items-center gap-1.5 text-gray-600"><Phone className="h-3.5 w-3.5 text-gray-400" /><span>{detail.employee.phone ?? '—'}</span></div>
                <div className="flex items-center gap-1.5 text-gray-600"><MapPin className="h-3.5 w-3.5 text-gray-400" /><span className="truncate">{detail.employee.location ?? '—'}</span></div>
              </div>
              <p className="text-[12px] font-bold text-gray-800">Hardware & Custody History</p>
              <div className="overflow-hidden rounded-xl border border-gray-100">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/70">
                      {['ASSET', 'RECEIPT', 'ISSUED (IST)', 'STATE'].map((h) => (
                        <th key={h} className="px-3 py-2 text-left text-[9.5px] font-bold tracking-wide text-gray-500">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {detail.assignments.length ? detail.assignments.map((a) => (
                      <tr key={a.id} className="border-b border-gray-50 last:border-0">
                        <td className="px-3 py-2">
                          <span className="block font-mono text-[11px] font-semibold text-blue-700">{a.asset.assetTag}</span>
                          <span className="text-[10px] text-gray-500">{a.asset.name}</span>
                        </td>
                        <td className="px-3 py-2 font-mono text-[10.5px] text-gray-500">{a.receiptId}</td>
                        <td className="px-3 py-2 text-[10.5px] text-gray-500">{a.issuedIST}</td>
                        <td className="px-3 py-2"><StatusPill status={a.status === 'ACTIVE' ? 'ACTIVE' : 'RETURNED'} /></td>
                      </tr>
                    )) : (
                      <tr><td colSpan={4} className="px-3 py-8 text-center text-xs text-gray-400">No custody history — this employee holds no assets.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center gap-2 py-14 text-sm text-gray-400">
              <Users className="h-4 w-4" /> Loading statement…
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!delTarget} onOpenChange={(o) => !o && setDelTarget(null)}>
        <AlertDialogContent className="sm:max-w-[440px]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[15px]">Delete employee “{delTarget?.name}”?</AlertDialogTitle>
            <AlertDialogDescription className="text-xs">
              This removes the employee record and {delTarget?._count.assignments ?? 0} custody history
              entr{(delTarget?._count.assignments ?? 0) === 1 ? 'y' : 'ies'}. If they currently hold assets in active
              custody, deletion will be blocked until those are returned. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-9 text-xs">Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleting}
              onClick={(ev) => { ev.preventDefault(); if (delTarget) removeEmployee(delTarget) }}
              className="h-9 bg-rose-600 text-xs hover:bg-rose-700"
            >
              {deleting ? 'Deleting…' : 'Delete employee'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
