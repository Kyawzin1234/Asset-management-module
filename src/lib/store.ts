'use client'

import { useEffect, useState } from 'react'
import { create } from 'zustand'

export type ViewKey =
  | 'dashboard'
  | 'inventory'
  | 'assign'
  | 'return'
  | 'transfer'
  | 'employees'
  | 'companies'
  | 'software'
  | 'vendors'
  | 'reports'
  | 'settings'

type AppState = {
  view: ViewKey
  scope: string
  scopeLabel: string
  refreshKey: number
  searchOpen: boolean
  reportsCategory: string
  dialog: 'add-asset' | 'assign' | 'return' | 'add-employee' | 'add-license' | 'add-vendor' | null
  setView: (v: ViewKey) => void
  setScope: (code: string, label: string) => void
  bumpRefresh: () => void
  setSearchOpen: (open: boolean) => void
  setReportsCategory: (key: string) => void
  openDialog: (d: AppState['dialog']) => void
  closeDialog: () => void
}

export const useApp = create<AppState>((set) => ({
  view: 'reports',
  scope: 'ACME',
  scopeLabel: 'Acme Corp Ltd (ACME)',
  refreshKey: 0,
  searchOpen: false,
  reportsCategory: 'audit',
  dialog: null,
  setView: (v) => set({ view: v }),
  setScope: (code, label) => set({ scope: code, scopeLabel: label, refreshKey: Date.now() }),
  bumpRefresh: () => set((s) => ({ refreshKey: s.refreshKey + 1 })),
  setSearchOpen: (open) => set({ searchOpen: open }),
  setReportsCategory: (key) => set({ reportsCategory: key }),
  openDialog: (d) => set({ dialog: d }),
  closeDialog: () => set({ dialog: null }),
}))

/** Shared fetch hook with loading + refetch (no synchronous setState inside the effect) */
export function useFetch<T>(url: string | null, deps: unknown[] = []) {
  const [state, setState] = useState<{ key: string | null; data: T | null; error: string | null }>({
    key: null,
    data: null,
    error: null,
  })
  const [tick, setTick] = useState(0)

  const depsKey = JSON.stringify(deps)
  const key = url ? url + '#' + tick + '#' + depsKey : null

  useEffect(() => {
    if (!key || !url) return
    let cancelled = false
    const capturedKey = key
    fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error('Request failed: ' + r.status)
        return r.json()
      })
      .then((data: T) => {
        if (!cancelled) setState({ key: capturedKey, data, error: null })
      })
      .catch((e: Error) => {
        if (!cancelled) setState((s) => ({ key: capturedKey, data: s.key === capturedKey ? s.data : s.data, error: e.message }))
      })
    return () => {
      cancelled = true
    }
  }, [key, url])

  const loading = !!key && state.key !== key

  return { data: state.data, loading, error: state.error, refetch: () => setTick((t) => t + 1) }
}
