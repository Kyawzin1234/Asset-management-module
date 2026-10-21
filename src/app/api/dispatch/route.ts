import { db } from '@/lib/db'
import { json, serverError } from '@/lib/api-helpers'

export async function GET() {
  try {
    const schedule = await db.dispatchSchedule.findFirst({ orderBy: { updatedAt: 'desc' } })
    return json({ schedule })
  } catch (e) {
    return serverError(e)
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json()
    const existing = await db.dispatchSchedule.findFirst({ orderBy: { updatedAt: 'desc' } })
    const data = {
      frequency: body.frequency || 'Monthly (1st Day 09:00 AM)',
      recipients: body.recipients || existing?.recipients || 'compliance@acme.com, dept-leads@acme.com',
      isActive: body.isActive ?? true,
    }
    const schedule = existing
      ? await db.dispatchSchedule.update({ where: { id: existing.id }, data })
      : await db.dispatchSchedule.create({ data })
    return json({ schedule })
  } catch (e) {
    return serverError(e)
  }
}
