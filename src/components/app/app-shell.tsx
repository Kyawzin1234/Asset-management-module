'use client'

import { useEffect } from 'react'
import {
  LayoutDashboard, Package, FileOutput, Undo2, ArrowLeftRight, Users, Building2,
  ShieldCheck, Store, BarChart3, Settings, Search, Plus, Bell, ChevronDown,
  BriefcaseBusiness, MonitorSmartphone, LogOut, UserCog,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useApp, useFetch, ViewKey } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { istShort } from '@/components/app/shared'
import { SearchPalette } from '@/components/app/dialogs/search-palette'
import { AddAssetDialog, AssignDialog, ReturnDialog } from '@/components/app/dialogs/action-dialogs'

type Bootstrap = {
  companies: { code: string; name: string }[]
  badges: { inventory: number; softwareExpiry: number }
}

const NAV_MAIN: { key: ViewKey; label: string; icon: typeof LayoutDashboard; badge?: 'inventory' }[] = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'inventory', label: 'Inventory', icon: Package, badge: 'inventory' },
  { key: 'assign', label: 'Assign Assets', icon: FileOutput },
  { key: 'return', label: 'Return Assets', icon: Undo2 },
  { key: 'transfer', label: 'Transfer / Reassign', icon: ArrowLeftRight },
  { key: 'employees', label: 'Employees', icon: Users },
  { key: 'companies', label: 'Companies', icon: Building2 },
]

const NAV_LIFECYCLE: { key: ViewKey; label: string; icon: typeof LayoutDashboard; badge?: 'softwareExpiry'; tag?: string }[] = [
  { key: 'software', label: 'Software & Expiry', icon: ShieldCheck, badge: 'softwareExpiry' },
  { key: 'vendors', label: 'Vendors & Brands', icon: Store },
  { key: 'reports', label: 'Reports & Exports', icon: BarChart3, tag: 'Hub' },
  { key: 'settings', label: 'Settings & Audit Log', icon: Settings, tag: 'Admin' },
]

export function AppShell({ children }: { children: React.ReactNode }) {
  const { view, setView, scope, setScope, searchOpen, setSearchOpen, openDialog, refreshKey } = useApp()
  const { data: boot } = useFetch<Bootstrap>('/api/bootstrap', [refreshKey])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setSearchOpen(true)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [setSearchOpen])

  const sidebarItems = (item: (typeof NAV_MAIN)[number] | (typeof NAV_LIFECYCLE)[number]) => {
    const Icon = item.icon
    const active = view === item.key
    const badgeVal = item.badge ? boot?.badges?.[item.badge] : undefined
    return (
      <button
        key={item.key}
        onClick={() => setView(item.key)}
        className={cn(
          'group flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] transition-colors',
          active ? 'bg-blue-50 font-semibold text-blue-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
        )}
      >
        <Icon className={cn('h-4 w-4 shrink-0', active ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600')} />
        <span className="flex-1 truncate text-left">{item.label}</span>
        {'badge' in item && item.badge && badgeVal !== undefined ? (
          <span
            className={cn(
              'rounded-md px-1.5 py-0.5 text-[10.5px] font-semibold',
              item.badge === 'softwareExpiry' ? 'bg-amber-50 text-amber-600' : 'bg-gray-100 text-gray-500'
            )}
          >
            {badgeVal.toLocaleString('en-US')}
          </span>
        ) : null}
        {'tag' in item && item.tag ? (
          <span
            className={cn(
              'rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide',
              item.key === 'reports' ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-500'
            )}
          >
            {item.tag}
          </span>
        ) : null}
      </button>
    )
  }

  return (
    <div className="flex h-screen flex-col bg-[#F1F2F4]">
      {/* ---------------- Header ---------------- */}
      <header className="z-30 flex h-[58px] shrink-0 items-center gap-3 border-b border-gray-200 bg-white px-3 lg:px-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 shadow-sm">
            <BriefcaseBusiness className="h-[18px] w-[18px] text-white" />
          </div>
          <div className="hidden min-w-0 md:block">
            <p className="truncate text-[14.5px] font-bold leading-tight text-gray-900">IT Asset Hub</p>
            <p className="truncate text-[10.5px] leading-tight text-gray-400">Enterprise Asset Operations</p>
          </div>
        </div>

        {/* Scope */}
        <div className="ml-1 hidden items-center gap-2 rounded-lg border border-gray-200 bg-white pl-2.5 pr-1 py-1 md:flex">
          <span className="text-[10px] font-bold tracking-wider text-gray-400">SCOPE</span>
          <Select value={scope} onValueChange={(v) => {
            const c = boot?.companies.find((x) => x.code === v)
            setScope(v, c ? `${c.name} (${c.code})` : v)
          }}>
            <SelectTrigger className="h-7 w-[190px] border-0 bg-transparent p-0 text-[12.5px] font-semibold text-gray-800 shadow-none focus:ring-0">
              <SelectValue placeholder="Select scope" />
            </SelectTrigger>
            <SelectContent>
              {(boot?.companies ?? []).map((c) => (
                <SelectItem key={c.code} value={c.code} className="text-[12.5px]">
                  {c.name} ({c.code})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Search trigger */}
        <button
          onClick={() => setSearchOpen(true)}
          className="group ml-auto flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-400 transition-colors hover:bg-gray-50 md:w-[300px] md:justify-start md:gap-2 md:px-3 xl:w-[380px]"
        >
          <Search className="h-4 w-4 shrink-0" />
          <span className="hidden flex-1 truncate text-left text-[12.5px] text-gray-400 md:block">
            Search Reports, Statements, Defect Registers...
          </span>
          <kbd className="hidden rounded border border-gray-200 bg-gray-50 px-1.5 py-0.5 text-[10px] font-medium text-gray-400 md:block">⌘K</kbd>
        </button>

        {/* Actions */}
        <div className="hidden items-center gap-2 lg:flex">
          <Button variant="outline" size="sm" onClick={() => openDialog('add-asset')} className="h-9 gap-1.5 rounded-lg border-gray-200 text-[12.5px] font-semibold text-gray-700">
            <Plus className="h-3.5 w-3.5" /> Add Asset
          </Button>
          <Button variant="outline" size="sm" onClick={() => openDialog('assign')} className="h-9 gap-1.5 rounded-lg border-gray-200 text-[12.5px] font-semibold text-gray-700">
            <FileOutput className="h-3.5 w-3.5" /> Assign
          </Button>
          <Button variant="outline" size="sm" onClick={() => openDialog('return')} className="h-9 gap-1.5 rounded-lg border-gray-200 text-[12.5px] font-semibold text-gray-700">
            <Undo2 className="h-3.5 w-3.5" /> Return
          </Button>
        </div>

        {/* Notifications */}
        <NotificationBell />

        {/* Profile */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-lg px-1.5 py-1 hover:bg-gray-50">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-700 text-[11px] font-bold text-white">AD</span>
              <span className="hidden text-left xl:block">
                <span className="block text-[12px] font-bold leading-tight text-gray-900">Admin</span>
                <span className="block text-[10.5px] leading-tight text-gray-400">IT Administrator</span>
              </span>
              <ChevronDown className="hidden h-3.5 w-3.5 text-gray-400 xl:block" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel className="text-xs">
              <span className="block font-semibold text-gray-800">admin@acme.com</span>
              <span className="text-gray-400">Full lifecycle + audit control</span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-xs gap-2" onClick={() => setView('settings')}>
              <UserCog className="h-3.5 w-3.5" /> Settings & Audit Log
            </DropdownMenuItem>
            <DropdownMenuItem className="text-xs gap-2 text-rose-600" onClick={() => setView('dashboard')}>
              <LogOut className="h-3.5 w-3.5" /> Sign out (demo)
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      {/* ---------------- Body ---------------- */}
      <div className="flex min-h-0 flex-1">
        {/* Sidebar */}
        <aside className="hidden w-[240px] shrink-0 flex-col overflow-y-auto border-r border-gray-200 bg-white px-3 py-4 lg:flex">
          <nav className="flex flex-col gap-0.5">{NAV_MAIN.map(sidebarItems)}</nav>
          <p className="mt-6 mb-2 px-2.5 text-[9.5px] font-bold uppercase tracking-widest text-gray-400">Lifecycle & Reference</p>
          <nav className="flex flex-col gap-0.5">{NAV_LIFECYCLE.map(sidebarItems)}</nav>
          <div className="mt-auto rounded-xl border border-blue-100 bg-blue-50/60 p-3">
            <div className="flex items-center gap-2">
              <MonitorSmartphone className="h-4 w-4 text-blue-600" />
              <p className="text-[11px] font-bold text-blue-800">Audited Scope</p>
            </div>
            <p className="mt-1 text-[10.5px] leading-relaxed text-blue-600/80">
              Every custody change is checksummed into the immutable audit stream.
            </p>
          </div>
        </aside>

        {/* Mobile nav */}
        <div className="fixed inset-x-0 bottom-0 z-30 flex items-center gap-1 overflow-x-auto border-t border-gray-200 bg-white px-2 py-1.5 lg:hidden">
          {[...NAV_MAIN, ...NAV_LIFECYCLE].map((item) => {
            const Icon = item.icon
            const active = view === item.key
            return (
              <button
                key={item.key}
                onClick={() => setView(item.key)}
                className={cn(
                  'flex min-w-[64px] flex-col items-center gap-0.5 rounded-lg px-2 py-1.5 text-[9.5px] font-medium',
                  active ? 'bg-blue-50 text-blue-700' : 'text-gray-500'
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="w-full truncate text-center">{item.label.split(' / ')[0].split(' & ')[0]}</span>
              </button>
            )
          })}
        </div>

        {/* Main */}
        <main className="min-w-0 flex-1 overflow-y-auto px-4 py-5 pb-24 lg:px-6 lg:pb-6">{children}</main>
      </div>

      {/* ---------------- Global dialogs ---------------- */}
      <SearchPalette open={searchOpen} onOpenChange={setSearchOpen} />
      <AddAssetDialog />
      <AssignDialog />
      <ReturnDialog />
    </div>
  )
}

function NotificationBell() {
  const { data } = useFetch<{ logs: { id: string; category: string; operator: string; actionDetails: string; timestamp: string }[] }>('/api/audit?limit=8')
  const hasUnread = !!data?.logs?.length
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="relative flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-50">
          <Bell className="h-[17px] w-[17px]" />
          {hasUnread ? <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white" /> : null}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[340px] p-0">
        <div className="border-b border-gray-100 px-4 py-3">
          <p className="text-[12px] font-bold text-gray-800">Audit Stream Notifications</p>
          <p className="text-[10.5px] text-gray-400">Latest immutable events across the scoped company</p>
        </div>
        <div className="max-h-[320px] overflow-y-auto">
          {(data?.logs ?? []).map((l) => (
            <div key={l.id} className="border-b border-gray-50 px-4 py-2.5 last:border-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-semibold text-blue-700">{l.category}</span>
                <span className="text-[9.5px] text-gray-400">{istShort(l.timestamp)}</span>
              </div>
              <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-gray-600">{l.actionDetails}</p>
              <p className="mt-0.5 text-[10px] text-gray-400">Operator: {l.operator}</p>
            </div>
          ))}
          {!data ? <p className="px-4 py-6 text-center text-xs text-gray-400">Loading…</p> : null}
        </div>
      </PopoverContent>
    </Popover>
  )
}
