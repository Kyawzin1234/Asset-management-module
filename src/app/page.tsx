'use client'

import { useApp } from '@/lib/store'
import { AppShell } from '@/components/app/app-shell'
import { DashboardView } from '@/components/app/views/dashboard-view'
import { InventoryView } from '@/components/app/views/inventory-view'
import { AssignView } from '@/components/app/views/assign-view'
import { ReturnView } from '@/components/app/views/return-view'
import { TransferView } from '@/components/app/views/transfer-view'
import { EmployeesView } from '@/components/app/views/employees-view'
import { CompaniesView } from '@/components/app/views/companies-view'
import { SoftwareView } from '@/components/app/views/software-view'
import { VendorsView } from '@/components/app/views/vendors-view'
import { ReportsView } from '@/components/app/views/reports-view'
import { SettingsView } from '@/components/app/views/settings-view'

export default function Home() {
  const { view } = useApp()

  return (
    <AppShell>
      {view === 'dashboard' ? <DashboardView /> : null}
      {view === 'inventory' ? <InventoryView /> : null}
      {view === 'assign' ? <AssignView /> : null}
      {view === 'return' ? <ReturnView /> : null}
      {view === 'transfer' ? <TransferView /> : null}
      {view === 'employees' ? <EmployeesView /> : null}
      {view === 'companies' ? <CompaniesView /> : null}
      {view === 'software' ? <SoftwareView /> : null}
      {view === 'vendors' ? <VendorsView /> : null}
      {view === 'reports' ? <ReportsView /> : null}
      {view === 'settings' ? <SettingsView /> : null}
    </AppShell>
  )
}
