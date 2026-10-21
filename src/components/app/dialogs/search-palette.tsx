'use client'

import { useEffect, useState } from 'react'
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from '@/components/ui/command'
import { Package, User, BarChart3, LayoutDashboard, Undo2, ArrowLeftRight, Users, Building2, ShieldCheck, Store, Settings, FileOutput } from 'lucide-react'
import { useApp, ViewKey } from '@/lib/store'
import { StatusPill } from '@/components/app/shared'

type SearchData = {
  assets: { id: string; assetTag: string; name: string; status: string; category: string }[]
  employees: { id: string; name: string; empCode: string; department: string }[]
}

const PAGES: { key: ViewKey; label: string; icon: typeof LayoutDashboard; hint: string }[] = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, hint: 'Operational overview' },
  { key: 'inventory', label: 'Inventory Master', icon: Package, hint: '1,482 registered assets' },
  { key: 'assign', label: 'Assign Assets', icon: FileOutput, hint: 'Custody handover receipts' },
  { key: 'return', label: 'Return Assets', icon: Undo2, hint: 'Restock & verify condition' },
  { key: 'transfer', label: 'Transfer / Reassign', icon: ArrowLeftRight, hint: 'Chain-of-custody moves' },
  { key: 'employees', label: 'Employees', icon: Users, hint: 'Directory & statements' },
  { key: 'companies', label: 'Companies', icon: Building2, hint: 'Scope management' },
  { key: 'software', label: 'Software & Expiry', icon: ShieldCheck, hint: 'License timelines' },
  { key: 'vendors', label: 'Vendors & Brands', icon: Store, hint: 'Partner directory' },
  { key: 'reports', label: 'Reports & Exports Hub', icon: BarChart3, hint: '7 standard reports' },
  { key: 'settings', label: 'Settings & Audit Log', icon: Settings, hint: 'Admin configuration' },
]

export function SearchPalette({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const [q, setQ] = useState('')
  const [data, setData] = useState<SearchData | null>(null)
  const { setView, setReportsCategory, openDialog } = useApp()

  useEffect(() => {
    const t = setTimeout(() => {
      if (!q.trim()) {
        setData(null)
        return
      }
      fetch('/api/search?q=' + encodeURIComponent(q))
        .then((r) => r.json())
        .then(setData)
        .catch(() => setData(null))
    }, 200)
    return () => clearTimeout(t)
  }, [q])

  const go = (fn: () => void) => {
    fn()
    onOpenChange(false)
  }

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Search assets, employees, reports…" value={q} onValueChange={setQ} />
      <CommandList>
        <CommandEmpty>{q ? 'No matches found.' : 'Type to search across the registry.'}</CommandEmpty>

        {data?.assets?.length ? (
          <CommandGroup heading="Assets">
            {data.assets.map((a) => (
              <CommandItem key={a.id} value={`${a.assetTag} ${a.name} ${a.category} ${a.id}`} onSelect={() => go(() => setView('inventory'))}>
                <Package className="h-4 w-4 text-blue-500" />
                <span className="font-mono text-xs">{a.assetTag}</span>
                <span className="truncate text-xs text-gray-500">{a.name}</span>
                <span className="ml-auto"><StatusPill status={a.status} /></span>
              </CommandItem>
            ))}
          </CommandGroup>
        ) : null}

        {data?.employees?.length ? (
          <CommandGroup heading="Employees">
            {data.employees.map((e) => (
              <CommandItem key={e.id} value={`${e.name} ${e.empCode} ${e.department} ${e.id}`} onSelect={() => go(() => setView('employees'))}>
                <User className="h-4 w-4 text-violet-500" />
                <span className="text-xs font-medium">{e.name}</span>
                <span className="truncate text-xs text-gray-400">{e.department}</span>
                <span className="ml-auto font-mono text-[10px] text-gray-400">{e.empCode}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        ) : null}

        {!q || (q && (data?.assets?.length || data?.employees?.length)) ? <CommandSeparator /> : null}

        <CommandGroup heading="Quick actions">
          <CommandItem onSelect={() => go(() => openDialog('add-asset'))}>
            <Package className="h-4 w-4 text-emerald-500" /> Register a new asset
          </CommandItem>
          <CommandItem onSelect={() => go(() => openDialog('assign'))}>
            <FileOutput className="h-4 w-4 text-blue-500" /> Assign asset to employee
          </CommandItem>
          <CommandItem onSelect={() => go(() => openDialog('return'))}>
            <Undo2 className="h-4 w-4 text-amber-500" /> Process a return
          </CommandItem>
        </CommandGroup>

        <CommandGroup heading="Navigate">
          {PAGES.map((p) => {
            const Icon = p.icon
            return (
              <CommandItem key={p.key} value={'page-' + p.label} onSelect={() => go(() => { setView(p.key); if (p.key === 'reports') setReportsCategory('audit') })}>
                <Icon className="h-4 w-4 text-gray-400" />
                <span className="text-xs">{p.label}</span>
                <span className="ml-auto text-[10px] text-gray-400">{p.hint}</span>
              </CommandItem>
            )
          })}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}
