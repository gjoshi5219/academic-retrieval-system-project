'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { bookmarks, resources } from '@/lib/db/schema'
import { and, eq, sql } from 'drizzle-orm'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'

async function requireUser() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('Unauthorized')
  return session.user
}

export async function toggleBookmark(resourceId: string) {
  const user = await requireUser()
  if (!resourceId || resourceId.length > 100) throw new Error('Invalid resource')
  const [existing] = await db.select({ id: bookmarks.id }).from(bookmarks).where(
    and(eq(bookmarks.userId, user.id), eq(bookmarks.resourceId, resourceId)),
  ).limit(1)

  if (existing) {
    await db.delete(bookmarks).where(and(eq(bookmarks.id, existing.id), eq(bookmarks.userId, user.id)))
    revalidatePath('/')
    return { bookmarked: false }
  }

  await db.insert(bookmarks).values({ id: crypto.randomUUID(), userId: user.id, resourceId })
  revalidatePath('/')
  return { bookmarked: true }
}

export async function recordDownload(resourceId: string) {
  await requireUser()
  if (!resourceId || resourceId.length > 100) throw new Error('Invalid resource')
  await db.update(resources)
    .set({ downloadCount: sql`${resources.downloadCount} + 1` })
    .where(eq(resources.id, resourceId))
  revalidatePath('/')
  return { ok: true }
}
