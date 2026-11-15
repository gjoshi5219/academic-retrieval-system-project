import { headers } from 'next/headers'
import { AuthScreen } from '@/components/auth-screen'
import { AcademicPortal } from '@/components/academic-portal'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { bookmarks, resources } from '@/lib/db/schema'
import { rankResources } from '@/lib/ranking'
import { eq } from 'drizzle-orm'

export default async function HomePage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return <AuthScreen />

  const [allResources, savedRows] = await Promise.all([
    db.select().from(resources),
    db.select({ resourceId: bookmarks.resourceId }).from(bookmarks).where(eq(bookmarks.userId, session.user.id)),
  ])

  const user = session.user as typeof session.user & { role?: string }
  return <AcademicPortal
    user={{ id: user.id, name: user.name, email: user.email, role: user.role ?? 'student' }}
    initialResources={rankResources(allResources)}
    initialBookmarks={savedRows.map((row) => row.resourceId)}
  />
}
