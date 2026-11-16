'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { resourceReports, resourceRequests, resourceViews, resources } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'

const reportReasons = ['Broken PDF', 'Incorrect topic', 'Missing document'] as const
const requestStatuses = ['Pending', 'Approved', 'Uploaded'] as const
const reportStatuses = ['Open', 'In review', 'Resolved'] as const

async function requireUser() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('Sign in to continue.')
  return session.user
}

async function requireTeacher() {
  const user = await requireUser()
  if (user.role !== 'teacher') throw new Error('Only faculty can manage this item.')
  return user
}

export async function createProblemReport(input: {
  resourceId?: string
  resourceTitle: string
  course: string
  reason: string
  details: string
}) {
  const user = await requireUser()
  const resourceId = input.resourceId?.trim() || null
  const reason = input.reason.trim()
  const title = input.resourceTitle.trim()
  const course = input.course.trim()
  const details = input.details.trim()

  if (!reportReasons.includes(reason as (typeof reportReasons)[number])) throw new Error('Choose a report category.')
  if (!title || title.length > 120 || !course || course.length > 80) throw new Error('Enter the resource name and course.')
  if (!details || details.length > 1000) throw new Error('Add a short description (up to 1,000 characters).')

  let resourceTitle = title
  let resourceCourse = course
  if (resourceId) {
    const [resource] = await db.select({ title: resources.title, course: resources.course }).from(resources).where(eq(resources.id, resourceId)).limit(1)
    if (!resource) throw new Error('That resource is no longer available.')
    resourceTitle = resource.title
    resourceCourse = resource.course
  }

  await db.insert(resourceReports).values({
    id: crypto.randomUUID(),
    reporterId: user.id,
    reporterName: user.name,
    resourceId,
    resourceTitle,
    course: resourceCourse,
    reason,
    details,
  })
  revalidatePath('/')
  return { ok: true }
}

export async function createResourceRequest(input: { title: string; course: string; details: string }) {
  const user = await requireUser()
  if (user.role === 'teacher') throw new Error('Resource requests are for student accounts.')
  const title = input.title.trim()
  const course = input.course.trim()
  const details = input.details.trim()
  if (!title || title.length > 120 || !course || course.length > 80 || details.length > 1000) {
    throw new Error('Check the title, course, and optional details.')
  }

  const id = crypto.randomUUID()
  const createdAt = new Date()
  await db.insert(resourceRequests).values({
    id,
    userId: user.id,
    requesterName: user.name,
    title,
    course,
    details,
  })
  revalidatePath('/')
  return { id, userId: user.id, requesterName: user.name, title, course, details, status: 'Pending', createdAt: createdAt.toISOString() }
}

export async function updateResourceRequestStatus(id: string, status: string) {
  await requireTeacher()
  if (!id || id.length > 100 || !requestStatuses.includes(status as (typeof requestStatuses)[number])) {
    throw new Error('Invalid request status.')
  }
  await db.update(resourceRequests).set({ status, updatedAt: new Date() }).where(eq(resourceRequests.id, id))
  revalidatePath('/')
  return { ok: true }
}

export async function updateProblemReportStatus(id: string, status: string) {
  await requireTeacher()
  if (!id || id.length > 100 || !reportStatuses.includes(status as (typeof reportStatuses)[number])) {
    throw new Error('Invalid report status.')
  }
  await db.update(resourceReports).set({ status }).where(eq(resourceReports.id, id))
  revalidatePath('/')
  return { ok: true }
}

export async function recordResourceView(resourceId: string) {
  const user = await requireUser()
  if (!resourceId || resourceId.length > 100) throw new Error('Invalid resource.')
  const [resource] = await db.select({ id: resources.id }).from(resources).where(eq(resources.id, resourceId)).limit(1)
  if (!resource) throw new Error('Resource not found.')

  await db.insert(resourceViews).values({ userId: user.id, resourceId, viewedAt: new Date() }).onConflictDoUpdate({
    target: [resourceViews.userId, resourceViews.resourceId],
    set: { viewedAt: new Date() },
  })
  revalidatePath('/')
  return { ok: true }
}
