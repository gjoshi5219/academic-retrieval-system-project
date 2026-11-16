import { cookies, headers } from 'next/headers'
import { AuthScreen } from '@/components/auth-screen'
import { AcademicPortal } from '@/components/academic-portal'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { bookmarks, resourceReports, resourceRequests, resourceViews, resources } from '@/lib/db/schema'
import { rankResources } from '@/lib/ranking'
import { desc, eq } from 'drizzle-orm'

export default async function HomePage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return <AuthScreen />

  const user = session.user as typeof session.user & { role?: string }
  const theme = (await cookies()).get('theme')?.value === 'dark' ? 'dark' : 'light'
  const isTeacher = user.role === 'teacher'
  const requestsQuery = isTeacher
    ? db.select().from(resourceRequests).orderBy(desc(resourceRequests.createdAt))
    : db.select().from(resourceRequests).where(eq(resourceRequests.userId, user.id)).orderBy(desc(resourceRequests.createdAt))
  const reportsQuery = isTeacher
    ? db.select().from(resourceReports).orderBy(desc(resourceReports.createdAt))
    : Promise.resolve([])

  const [allResources, savedRows, requests, reports, recentRows] = await Promise.all([
    db.select().from(resources),
    db.select({ resourceId: bookmarks.resourceId }).from(bookmarks).where(eq(bookmarks.userId, user.id)),
    requestsQuery,
    reportsQuery,
    db.select({
      id: resources.id,
      title: resources.title,
      description: resources.description,
      course: resources.course,
      category: resources.category,
      mimeType: resources.mimeType,
      fileName: resources.fileName,
      fileSize: resources.fileSize,
      priority: resources.priority,
      uploadedBy: resources.uploadedBy,
      uploadedByName: resources.uploadedByName,
      createdAt: resources.createdAt,
      downloadCount: resources.downloadCount,
      viewedAt: resourceViews.viewedAt,
    }).from(resourceViews).innerJoin(resources, eq(resources.id, resourceViews.resourceId))
      .where(eq(resourceViews.userId, user.id)).orderBy(desc(resourceViews.viewedAt)).limit(8),
  ])

  return <AcademicPortal
    user={{ id: user.id, name: user.name, email: user.email, role: user.role ?? 'student' }}
    theme={theme}
    initialResources={rankResources(allResources)}
    initialBookmarks={savedRows.map((row) => row.resourceId)}
    initialRequests={requests}
    initialReports={reports}
    initialRecent={recentRows}
  />
}
