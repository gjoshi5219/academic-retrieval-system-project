import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { resources } from '@/lib/db/schema'
import { put, del } from '@vercel/blob'
import { headers } from 'next/headers'
import { NextResponse } from 'next/server'

const MAX_FILE_SIZE = 50 * 1024 * 1024
const allowedCategories = new Set(['Lecture notes', 'Study guide', 'Past paper', 'Assignment', 'Reference'])

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return NextResponse.json({ error: 'Sign in to upload.' }, { status: 401 })
  if (session.user.role !== 'teacher') return NextResponse.json({ error: 'Only teacher accounts can upload.' }, { status: 403 })

  const form = await request.formData()
  const file = form.get('file')
  const title = String(form.get('title') ?? '').trim()
  const course = String(form.get('course') ?? '').trim()
  const description = String(form.get('description') ?? '').trim()
  const category = String(form.get('category') ?? '')
  const priority = Number(form.get('priority'))

  if (!(file instanceof File) || !file.size || file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: 'Choose a file smaller than 50 MB.' }, { status: 400 })
  }
  if (!title || title.length > 120 || !course || course.length > 80 || description.length > 500) {
    return NextResponse.json({ error: 'Check the title, course, and description fields.' }, { status: 400 })
  }
  if (!allowedCategories.has(category) || !Number.isInteger(priority) || priority < 1 || priority > 10) {
    return NextResponse.json({ error: 'Choose a category and priority from 1 to 10.' }, { status: 400 })
  }

  const id = crypto.randomUUID()
  const fileName = file.name.replace(/[\\/\r\n\0]/g, '_').slice(0, 180) || 'download'
  const storagePath = `academic-resources/${id}/${fileName}`
  let blob: Awaited<ReturnType<typeof put>>
  try {
    blob = await put(storagePath, file, {
      access: 'private',
      addRandomSuffix: false,
      contentType: file.type || 'application/octet-stream',
    })
  } catch (error) {
    console.error('Resource file upload failed:', error)
    return NextResponse.json({ error: 'File storage is temporarily unavailable. Please try again.' }, { status: 503 })
  }

  try {
    await db.insert(resources).values({
      id,
      title,
      description,
      course,
      category,
      mimeType: file.type || 'application/octet-stream',
      fileName,
      fileSize: file.size,
      storagePath: blob.pathname,
      priority,
      uploadedBy: session.user.id,
      uploadedByName: session.user.name,
    })
  } catch (error) {
    await del(blob.pathname)
    console.error('Resource metadata save failed:', error)
    return NextResponse.json({ error: 'Upload could not be saved. Please try again.' }, { status: 500 })
  }

  return NextResponse.json({ ok: true }, { status: 201 })
}
