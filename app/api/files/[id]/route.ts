import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { resources } from '@/lib/db/schema'
import { get } from '@vercel/blob'
import { eq } from 'drizzle-orm'
import { headers } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return NextResponse.json({ error: 'Sign in to access this file.' }, { status: 401 })

  const { id } = await params
  const [resource] = await db.select().from(resources).where(eq(resources.id, id)).limit(1)
  if (!resource) return NextResponse.json({ error: 'File not found.' }, { status: 404 })

  const blob = await get(resource.storagePath, { access: 'private' })
  if (!blob || blob.statusCode !== 200) return NextResponse.json({ error: 'File not found.' }, { status: 404 })

  const safeName = resource.fileName.replace(/[\r\n"\\]/g, '_')
  return new NextResponse(blob.stream, {
    headers: {
      'Content-Type': resource.mimeType,
      'Content-Disposition': `attachment; filename="${safeName}"; filename*=UTF-8''${encodeURIComponent(resource.fileName)}`,
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}
