'use client'

import { ReactNode } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

/* ---------------- Report category tone system (from Figma) ---------------- */

export type Tone =
  | 'core' | 'custody' | 'handover' | 'chain' | 'maintenance' | 'lifecycle' | 'security'
  | 'neutral'

export const TONE_BADGE: Record<Tone, string> = {
  core: 'bg-blue-50 text-blue-700',
  custody: 'bg-violet-50 text-violet-700',
  handover: 'bg-emerald-50 text-emerald-700',
  chain: 'bg-teal-50 text-teal-700',
  maintenance: 'bg-rose-50 text-rose-600',
  lifecycle: 'bg-amber-50 text-amber-600',
  security: 'bg-blue-50 text-blue-700',
  neutral: 'bg-gray-100 text-gray-600',
}

export const TONE_TILE: Record<Tone, string> = {
  core: 'bg-blue-600',
  custody: 'bg-violet-500',
  handover: 'bg-emerald-500',
  chain: 'bg-teal-500',
  maintenance: 'bg-rose-500',
  lifecycle: 'bg-amber-500',
  security: 'bg-slate-900',
  neutral: 'bg-gray-400',
}

export function Badge({ tone, children, className }: { tone: Tone; children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md px-2 py-0.5 text-[10.5px] font-semibold tracking-wide',
        TONE_BADGE[tone],
        className
      )}
    >
      {children}
    </span>
  )
}

/* ---------------- KPI card ---------------- */

export function KpiCard({
  label, value, sub, subTone = 'neutral', icon, className,
}: {
  label: string
  value: string | number
  sub?: ReactNode
  subTone?: 'green' | 'violet' | 'red' | 'amber' | 'neutral'
  icon?: ReactNode
  className?: string
}) {
  const subCls: Record<string, string> = {
    green: 'text-emerald-700 bg-emerald-50',
    violet: 'text-violet-700 bg-violet-50',
    red: 'text-rose-600 bg-rose-50',
    amber: 'text-amber-600 bg-amber-50',
    neutral: 'text-gray-600 bg-gray-100',
  }
  return (
    <div className={cn('rounded-xl border border-gray-200 bg-white p-4', className)}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-[10.5px] font-semibold tracking-wide text-gray-500">{label}</p>
          <p className="mt-1.5 text-[26px] font-bold leading-none text-gray-900">{value}</p>
          {sub ? (
            <span className={cn('mt-2.5 inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-semibold', subCls[subTone])}>
              {sub}
            </span>
          ) : null}
        </div>
        {icon ? (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg">{icon}</div>
        ) : null}
      </div>
    </div>
  )
}

/* ---------------- Pagination ---------------- */

export function Pagination({
  page, pageSize, total, onPage, className,
}: {
  page: number
  pageSize: number
  total: number
  onPage: (p: number) => void
  className?: string
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize))
  const nums: (number | '…')[] = []
  if (pages <= 6) {
    for (let i = 1; i <= pages; i++) nums.push(i)
  } else {
    const s = Math.max(1, Math.min(page - 1, pages - 3))
    nums.push(1)
    if (s > 2) nums.push('…')
    for (let i = s; i <= Math.min(pages, s + 2); i++) if (i !== 1 && i !== pages) nums.push(i)
    if (s + 2 < pages - 1) nums.push('…')
    if (!nums.includes(pages)) nums.push(pages)
  }
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(total, page * pageSize)
  return (
    <div className={cn('flex flex-col gap-3 pt-3 sm:flex-row sm:items-center sm:justify-between', className)}>
      <p className="text-xs text-gray-500">
        Showing {from} to {to} of {total.toLocaleString('en-US')} records
      </p>
      <div className="flex items-center gap-1.5">
        <Button
          variant="outline" size="sm" disabled={page <= 1}
          onClick={() => onPage(page - 1)}
          className="h-7 gap-1 rounded-md px-2.5 text-xs text-gray-600"
        >
          <ChevronLeft className="h-3.5 w-3.5" /> Previous
        </Button>
        {nums.map((n, i) =>
          n === '…' ? (
            <span key={'e' + i} className="px-1 text-xs text-gray-400">…</span>
          ) : (
            <button
              key={n}
              onClick={() => onPage(n)}
              className={cn(
                'h-7 w-7 rounded-md text-xs font-medium transition-colors',
                n === page ? 'bg-blue-600 text-white shadow-sm' : 'border border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
              )}
            >
              {n}
            </button>
          )
        )}
        <Button
          variant="outline" size="sm" disabled={page >= pages}
          onClick={() => onPage(page + 1)}
          className="h-7 gap-1 rounded-md px-2.5 text-xs text-gray-600"
        >
          Next <ChevronRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  )
}

/* ---------------- Section header (uppercase small) ---------------- */

export function SectionHeader({ icon, title, right }: { icon?: ReactNode; title: string; right?: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        {icon}
        <h3 className="text-[12px] font-bold tracking-wide text-gray-800">{title}</h3>
      </div>
      {right}
    </div>
  )
}

/* ---------------- Page header with breadcrumb ---------------- */

export function PageHeader({
  breadcrumb, title, subtitle, actions,
}: {
  breadcrumb: string[]
  title: string
  subtitle?: string
  actions?: ReactNode
}) {
  return (
    <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
      <div className="min-w-0">
        <nav className="flex flex-wrap items-center gap-1.5 text-[11.5px] text-gray-400">
          {breadcrumb.map((b, i) => (
            <span key={b} className="flex items-center gap-1.5">
              {i > 0 && <span className="text-gray-300">›</span>}
              <span className={i === breadcrumb.length - 1 ? 'font-medium text-gray-600' : ''}>{b}</span>
            </span>
          ))}
        </nav>
        <h1 className="mt-1 truncate text-[21px] font-bold tracking-tight text-gray-900">{title}</h1>
        {subtitle ? <p className="mt-0.5 max-w-3xl text-[12.5px] leading-relaxed text-gray-500">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  )
}

/* ---------------- Misc ---------------- */

export function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    IN_STOCK: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    ASSIGNED: 'bg-blue-50 text-blue-700 border-blue-200',
    REPAIR: 'bg-rose-50 text-rose-600 border-rose-200',
    RETIRED: 'bg-gray-100 text-gray-500 border-gray-200',
    ACTIVE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    RETURNED: 'bg-gray-100 text-gray-500 border-gray-200',
    OPEN: 'bg-rose-50 text-rose-600 border-rose-200',
    IN_PROGRESS: 'bg-amber-50 text-amber-600 border-amber-200',
    RESOLVED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  }
  const label = status.replace('_', ' ')
  return (
    <span className={cn('inline-flex items-center rounded-full border px-2 py-0.5 text-[10.5px] font-semibold', map[status] ?? 'border-gray-200 bg-gray-50 text-gray-600')}>
      {label.charAt(0) + label.slice(1).toLowerCase()}
    </span>
  )
}

export function EmptyState({ icon, title, hint }: { icon?: ReactNode; title: string; hint?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
      {icon ? <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gray-100 text-gray-400">{icon}</div> : null}
      <p className="text-sm font-medium text-gray-600">{title}</p>
      {hint ? <p className="max-w-sm text-xs text-gray-400">{hint}</p> : null}
    </div>
  )
}

export function LoadingBlock({ label = 'Loading data…' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-12 text-sm text-gray-400">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-gray-200 border-t-blue-500" />
      {label}
    </div>
  )
}

/** format UTC ISO date string to IST display */
export function ist(dateISO: string | Date, withSuffix = true): string {
  const d = typeof dateISO === 'string' ? new Date(dateISO) : dateISO
  const ist = new Date(d.getTime() + 5.5 * 3600 * 1000)
  const p = (n: number) => String(n).padStart(2, '0')
  const base = `${ist.getUTCFullYear()}-${p(ist.getUTCMonth() + 1)}-${p(ist.getUTCDate())} ${p(ist.getUTCHours())}:${p(ist.getUTCMinutes())}:${p(ist.getUTCSeconds())}`
  return withSuffix ? base + ' IST' : base
}

export function istShort(dateISO: string | Date): string {
  const d = typeof dateISO === 'string' ? new Date(dateISO) : dateISO
  const ist = new Date(d.getTime() + 5.5 * 3600 * 1000)
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const p = (n: number) => String(n).padStart(2, '0')
  return `${months[ist.getUTCMonth()]} ${ist.getUTCDate()}, ${ist.getUTCFullYear()} • ${p(ist.getUTCHours())}:${p(ist.getUTCMinutes())} IST`
}

export function dateOnly(dateISO: string | Date | null | undefined): string {
  if (!dateISO) return '—'
  const d = typeof dateISO === 'string' ? new Date(dateISO) : dateISO
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())}`
}
