'use client'

import { Building2, MapPin, CheckCircle2, ArrowRight } from 'lucide-react'
import { useApp, useFetch } from '@/lib/store'
import { PageHeader } from '@/components/app/shared'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type CompanyRow = {
  id: string; code: string; name: string; industry: string | null; location: string | null
  stats: { assets: number; assigned: number; repair: number; employees: number; licenses: number; utilization: number }
}

export function CompaniesView() {
  const { scope, setScope, bumpRefresh } = useApp()
  const { data } = useFetch<{ companies: CompanyRow[] }>('/api/companies')

  return (
    <div className="mx-auto max-w-[1400px]">
      <PageHeader
        breadcrumb={['Organization', 'Companies']}
        title="Company Scope Registry"
        subtitle="Multi-entity asset operations — switch the working scope to filter every register, report and audit stream."
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {(data?.companies ?? []).map((c) => {
          const active = c.code === scope
          return (
            <div
              key={c.id}
              className={cn(
                'rounded-xl border bg-white p-4 transition-all',
                active ? 'border-blue-500 shadow-[0_0_0_1px_rgba(21,112,239,0.25)]' : 'border-gray-200 hover:border-gray-300'
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 text-white">
                    <Building2 className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-[14px] font-bold text-gray-900">{c.name}</p>
                    <p className="font-mono text-[10.5px] text-gray-400">{c.code}</p>
                  </div>
                </div>
                {active ? (
                  <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-600">
                    <CheckCircle2 className="h-3 w-3" /> Active Scope
                  </span>
                ) : null}
              </div>

              <div className="mt-3 flex items-center gap-1.5 text-[11px] text-gray-500">
                <MapPin className="h-3.5 w-3.5 text-gray-400" /> {c.location ?? '—'}
                <span className="text-gray-300">·</span> {c.industry ?? '—'}
              </div>

              <div className="mt-3.5 grid grid-cols-3 gap-2">
                {[
                  { label: 'Assets', value: c.stats.assets },
                  { label: 'Assigned', value: c.stats.assigned },
                  { label: 'Employees', value: c.stats.employees },
                ].map((s) => (
                  <div key={s.label} className="rounded-lg bg-gray-50 p-2.5 text-center">
                    <p className="text-[16px] font-bold text-gray-900">{s.value.toLocaleString('en-US')}</p>
                    <p className="text-[9.5px] font-semibold uppercase tracking-wide text-gray-400">{s.label}</p>
                  </div>
                ))}
              </div>

              <div className="mt-3">
                <div className="flex items-center justify-between text-[10.5px] text-gray-500">
                  <span>Custody utilization</span>
                  <span className="font-bold text-gray-800">{c.stats.utilization}%</span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-gray-100">
                  <div className="h-full rounded-full bg-blue-600" style={{ width: Math.min(100, c.stats.utilization) + '%' }} />
                </div>
              </div>

              <Button
                variant={active ? 'secondary' : 'default'}
                size="sm"
                disabled={active}
                onClick={() => { setScope(c.code, `${c.name} (${c.code})`); bumpRefresh() }}
                className={cn(
                  'mt-3.5 h-8 w-full gap-1.5 rounded-lg text-[11.5px] font-semibold',
                  active ? '' : 'bg-blue-600 text-white hover:bg-blue-700'
                )}
              >
                {active ? 'Currently in scope' : <>Switch to this scope <ArrowRight className="h-3.5 w-3.5" /></>}
              </Button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
