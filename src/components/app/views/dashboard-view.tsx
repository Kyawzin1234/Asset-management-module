'use client'

import {
  BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { Package, ClipboardList, Wrench, ShieldHalf, ArrowRight, ShieldAlert, TrendingUp, Wallet, Users2 } from 'lucide-react'
import { useApp, useFetch } from '@/lib/store'
import { KpiCard, PageHeader, dateOnly, istShort } from '@/components/app/shared'
import { Button } from '@/components/ui/button'

type Stats = {
  kpis: { total: number; assigned: number; repair: number; inStock: number; retired: number; utilization: number; downtime: number; warrantyAlerts: number; warrantyHw: number; licExpiring: number }
  byCategory: { category: string; count: number; value: number }[]
  trend: { month: string; assigned: number; returned: number }[]
  openRepairs: number
  repairCost: number
  employeesCount: number
  licensesCount: number
  auditCount: number
  recentAudit: { id: string; category: string; operator: string; affectedRecord: string; actionDetails: string; timestamp: string }[]
  expiringSoon: { assetTag: string; name: string; warrantyEnd: string; status: string }[]
}

const STATUS_COLORS = ['#1570EF', '#17B26A', '#F04438', '#98A2B3', '#F79009']

export function DashboardView() {
  const { scope, setView, openDialog, refreshKey } = useApp()
  const { data: stats } = useFetch<Stats>(`/api/stats?company=${scope}`, [refreshKey])
  const k = stats?.kpis

  const pieData = k ? [
    { name: 'Assigned', value: k.assigned },
    { name: 'In Stock', value: k.inStock },
    { name: 'Under Repair', value: k.repair },
    { name: 'Retired', value: k.retired },
  ] : []

  return (
    <div className="mx-auto max-w-[1400px]">
      <PageHeader
        breadcrumb={['Operations Center', 'Dashboard']}
        title="Asset Operations Overview"
        subtitle="Live operational health of the hardware estate — custody, downtime, expiries and the immutable audit stream at a glance."
        actions={
          <>
            <Button variant="outline" size="sm" className="h-9 rounded-lg border-gray-200 text-[12.5px] font-semibold text-gray-700" onClick={() => openDialog('add-asset')}>
              Register Asset
            </Button>
            <Button size="sm" className="h-9 rounded-lg bg-blue-600 text-[12.5px] font-semibold text-white hover:bg-blue-700" onClick={() => setView('reports')}>
              Open Reports Hub <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3.5 xl:grid-cols-4">
        <KpiCard label="TOTAL REGISTERED ASSETS" value={(k?.total ?? 0).toLocaleString('en-US')} sub="100% Audited Scope" subTone="green"
          icon={<span className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50"><Package className="h-[18px] w-[18px] text-blue-600" /></span>} />
        <KpiCard label="ASSIGNED / ACTIVE" value={(k?.assigned ?? 0).toLocaleString('en-US')} sub={`${k?.utilization ?? 0}% Utilization`} subTone="violet"
          icon={<span className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-50"><ClipboardList className="h-[18px] w-[18px] text-violet-600" /></span>} />
        <KpiCard label="DEFECTIVE / UNDER REPAIR" value={(k?.repair ?? 0).toLocaleString('en-US')} sub={`${k?.downtime ?? 0}% Hardware Downtime`} subTone="red"
          icon={<span className="flex h-10 w-10 items-center justify-center rounded-lg bg-rose-50"><Wrench className="h-[18px] w-[18px] text-rose-500" /></span>} />
        <KpiCard label="WARRANTY & EXPIRY ALERTS" value={(k?.warrantyAlerts ?? 0).toLocaleString('en-US')} sub="Expiry within 60 Days" subTone="amber"
          icon={<span className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50"><ShieldHalf className="h-[18px] w-[18px] text-amber-500" /></span>} />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[1.6fr_1fr]">
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-[12.5px] font-bold text-gray-800">Custody Movement — Last 6 Months</h3>
              <p className="text-[11px] text-gray-400">Assignments issued vs returns processed (scoped company)</p>
            </div>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="mt-3 h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats?.trend ?? []} margin={{ top: 5, right: 8, left: -18, bottom: 0 }}>
                <defs>
                  <linearGradient id="gA" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#1570EF" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#1570EF" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="gR" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#17B26A" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#17B26A" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#EEF0F3" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#98A2B3' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#98A2B3' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #EAECF0' }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Area type="monotone" dataKey="assigned" name="Assigned" stroke="#1570EF" strokeWidth={2} fill="url(#gA)" />
                <Area type="monotone" dataKey="returned" name="Returned" stroke="#17B26A" strokeWidth={2} fill="url(#gR)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <h3 className="text-[12.5px] font-bold text-gray-800">Fleet Status Split</h3>
          <p className="text-[11px] text-gray-400">Current lifecycle distribution</p>
          <div className="mt-2 h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={2} strokeWidth={0}>
                  {pieData.map((_, i) => <Cell key={i} fill={STATUS_COLORS[i % STATUS_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[1.6fr_1fr]">
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-[12.5px] font-bold text-gray-800">Category Estate & Capital Value</h3>
              <p className="text-[11px] text-gray-400">Units registered per hardware category</p>
            </div>
            <Wallet className="h-4 w-4 text-blue-500" />
          </div>
          <div className="mt-3 h-[230px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats?.byCategory ?? []} margin={{ top: 5, right: 8, left: -18, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EEF0F3" vertical={false} />
                <XAxis dataKey="category" tick={{ fontSize: 10, fill: '#98A2B3' }} axisLine={false} tickLine={false} interval={0} angle={-18} dy={8} height={42} />
                <YAxis tick={{ fontSize: 11, fill: '#98A2B3' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} formatter={(v: number, n: string) => n === 'value' ? ['$' + v.toLocaleString('en-US'), 'Capital Value'] : [v, 'Units']} />
                <Bar dataKey="count" name="Units" fill="#1570EF" radius={[5, 5, 0, 0]} maxBarSize={38} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-amber-500" />
              <h3 className="text-[12.5px] font-bold text-gray-800">Warranty Expiring Soon</h3>
            </div>
            <div className="mt-2.5 space-y-2">
              {(stats?.expiringSoon ?? []).slice(0, 4).map((a) => (
                <div key={a.assetTag} className="flex items-center justify-between gap-2 rounded-lg border border-gray-100 bg-gray-50/60 px-3 py-2">
                  <div className="min-w-0">
                    <p className="truncate font-mono text-[11px] font-semibold text-blue-700">{a.assetTag}</p>
                    <p className="truncate text-[10.5px] text-gray-500">{a.name}</p>
                  </div>
                  <span className="shrink-0 rounded-md bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-600">{dateOnly(a.warrantyEnd)}</span>
                </div>
              ))}
              {!stats?.expiringSoon?.length ? <p className="py-3 text-center text-xs text-gray-400">No expiries in the next 60 days.</p> : null}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Employees', value: stats?.employeesCount ?? 0, icon: Users2, cls: 'text-blue-600 bg-blue-50' },
              { label: 'Open RMAs', value: stats?.openRepairs ?? 0, icon: Wrench, cls: 'text-rose-500 bg-rose-50' },
              { label: 'Audit Events', value: (stats?.auditCount ?? 0) > 999 ? ((stats!.auditCount / 1000).toFixed(1) + 'k') : (stats?.auditCount ?? 0), icon: ShieldHalf, cls: 'text-emerald-600 bg-emerald-50' },
            ].map((s) => (
              <div key={s.label} className="rounded-xl border border-gray-200 bg-white p-3">
                <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${s.cls}`}>
                  <s.icon className="h-4 w-4" />
                </span>
                <p className="mt-2 text-[18px] font-bold text-gray-900">{s.value}</p>
                <p className="text-[10.5px] text-gray-400">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-gray-200 bg-white p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-[12.5px] font-bold text-gray-800">Latest Audit Stream Events</h3>
            <p className="text-[11px] text-gray-400">Immutable, checksum-verified operator history</p>
          </div>
          <Button variant="ghost" size="sm" className="text-[11.5px] font-semibold text-blue-600" onClick={() => setView('settings')}>
            View full trail <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>
        <div className="mt-3 divide-y divide-gray-50">
          {(stats?.recentAudit ?? []).slice(0, 6).map((l) => (
            <div key={l.id} className="flex items-start justify-between gap-4 py-2.5">
              <div className="min-w-0">
                <p className="text-[12px] text-gray-700">
                  <span className="font-semibold text-gray-900">{l.category}</span>
                  <span className="text-gray-300"> · </span>
                  <span className="font-mono text-[11px] text-blue-700">{l.affectedRecord}</span>
                </p>
                <p className="truncate text-[11px] text-gray-500">{l.actionDetails}</p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-[10px] text-gray-400">{istShort(l.timestamp)}</p>
                <p className="text-[10px] text-gray-400">by {l.operator}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
