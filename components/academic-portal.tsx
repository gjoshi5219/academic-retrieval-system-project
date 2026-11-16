'use client'

import { useMemo, useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { authClient } from '@/lib/auth-client'
import { recordDownload, toggleBookmark } from '@/app/actions/resources'
import { recordResourceView } from '@/app/actions/library'
import { RecentViewsPanel, ReportDialog, ReportsPanel, RequestDialog, RequestsPanel, type ReportRecord, type RequestRecord, type ResourceRecord } from '@/components/library-workflows'
import { ThemeToggle } from '@/components/theme-toggle'
import { FacultyDashboard } from '@/components/faculty-dashboard'
import {
  ArrowDownToLine, ArrowLeft, ArrowRight, ArrowUpRight, Bookmark, BookOpen, BookOpenCheck,
  Check, ChevronDown, FileArchive, FileAudio, FileImage, FileSpreadsheet, FileText,
  GraduationCap, LayoutGrid, LibraryBig, LogOut, Plus, Search, SlidersHorizontal,
  Sparkles, UploadCloud, X, Clock3, ClipboardList, ShieldAlert,
} from 'lucide-react'

type Resource = {
  id: string
  title: string
  description: string
  course: string
  category: string
  mimeType: string
  fileName: string
  fileSize: number
  priority: number
  uploadedBy: string
  uploadedByName: string
  createdAt: Date | string
  downloadCount: number
}

type UserInfo = { id: string; name: string; email: string; role: string }
const categories = ['All resources', 'Lecture notes', 'Study guide', 'Past paper', 'Assignment', 'Reference']
const fileIcon = (mime: string) => mime.includes('pdf') ? FileText : mime.includes('image') ? FileImage : mime.includes('audio') ? FileAudio : mime.includes('spreadsheet') || mime.includes('excel') || mime.includes('csv') ? FileSpreadsheet : mime.includes('zip') || mime.includes('archive') ? FileArchive : FileText
const formatSize = (bytes: number) => bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`
const formatDate = (date: Date | string) => new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(new Date(date))

export function AcademicPortal({ user, theme, initialResources, initialBookmarks, initialRequests, initialReports, initialRecent }: { user: UserInfo; theme: 'light' | 'dark'; initialResources: Resource[]; initialBookmarks: string[]; initialRequests: RequestRecord[]; initialReports: ReportRecord[]; initialRecent: ResourceRecord[] }) {
  const router = useRouter()
  const [resources, setResources] = useState(initialResources)
  const [bookmarks, setBookmarks] = useState(new Set(initialBookmarks))
  const [requests, setRequests] = useState(initialRequests)
  const [reports, setReports] = useState(initialReports)
  const [recentResources, setRecentResources] = useState(initialRecent)
  const [category, setCategory] = useState('All resources')
  const [search, setSearch] = useState('')
  const [bookmarksOnly, setBookmarksOnly] = useState(false)
  const [activeSection, setActiveSection] = useState<'library' | 'recent' | 'requests' | 'reports'>('library')
  const [uploadOpen, setUploadOpen] = useState(false)
  const [requestOpen, setRequestOpen] = useState(false)
  const [reportingResource, setReportingResource] = useState<Pick<Resource, 'id' | 'title' | 'course'> | null | undefined>(undefined)
  const [toast, setToast] = useState('')
  const [uploading, setUploading] = useState(false)

  const filteredResources = useMemo(() => resources.filter((resource) => {
    const query = search.trim().toLowerCase()
    const matchesSearch = !query || [resource.title, resource.course, resource.description, resource.uploadedByName].some((text) => text.toLowerCase().includes(query))
    const matchesCategory = category === 'All resources' || resource.category === category
    return matchesSearch && matchesCategory && (!bookmarksOnly || bookmarks.has(resource.id))
  }), [resources, search, category, bookmarksOnly, bookmarks])

  function notify(message: string) {
    setToast(message)
    window.setTimeout(() => setToast(''), 2400)
  }

  async function onBookmark(id: string) {
    const wasSaved = bookmarks.has(id)
    setBookmarks((previous) => { const next = new Set(previous); wasSaved ? next.delete(id) : next.add(id); return next })
    try { await toggleBookmark(id) } catch { setBookmarks((previous) => { const next = new Set(previous); wasSaved ? next.add(id) : next.delete(id); return next }); notify('Could not update bookmark. Try again.') }
  }

  async function onDownload(resource: Resource) {
    try {
      await recordDownload(resource.id)
      setResources((previous) => previous.map((item) => item.id === resource.id ? { ...item, downloadCount: item.downloadCount + 1 } : item))
      window.location.assign(`/api/files/${encodeURIComponent(resource.id)}`)
    } catch { notify('Could not download this file. Please sign in again.') }
  }

  async function onViewResource(resource: ResourceRecord) {
    const viewedAt = new Date().toISOString()
    setRecentResources((previous) => [{ ...resource, viewedAt }, ...previous.filter((item) => item.id !== resource.id)].slice(0, 8))
    try { await recordResourceView(resource.id) } catch { notify('Could not save this resource to your recent views.') }
  }

  function saveRequest(request: RequestRecord) {
    setRequests((previous) => [request, ...previous.filter((item) => item.id !== request.id)])
  }

  async function submitUpload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setUploading(true)
    const form = new FormData(event.currentTarget)
    try {
      const response = await fetch('/api/resources', { method: 'POST', body: form })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Upload failed')
      setUploadOpen(false)
      notify('Resource added to the library.')
      router.refresh()
    } catch (error) { notify(error instanceof Error ? error.message : 'Upload failed. Please try again.') }
    finally { setUploading(false) }
  }

  const isTeacher = user.role === 'teacher'
  const initials = user.name.split(/\s+/).map((part) => part[0]).slice(0, 2).join('').toUpperCase()

  return (
    <main className="portal-shell">
      <aside className="sidebar">
        <a className="brand sidebar-brand" href="/" aria-label="Smart Library home"><span className="brand-mark"><LibraryBig size={19} /></span><span>Smart <span>Library</span></span></a>
        <div className="sidebar-label">LIBRARY</div>
        <button className={`side-link ${activeSection === 'library' && !bookmarksOnly ? 'active' : ''}`} onClick={() => { setActiveSection('library'); setBookmarksOnly(false) }}><LayoutGrid size={17} /> All resources <span className="side-count">{resources.length}</span></button>
        <button className={`side-link ${activeSection === 'library' && bookmarksOnly ? 'active' : ''}`} onClick={() => { setActiveSection('library'); setBookmarksOnly(true) }}><Bookmark size={17} /> My bookmarks <span className="side-count">{bookmarks.size}</span></button>
        <button className={`side-link ${activeSection === 'recent' ? 'active' : ''}`} onClick={() => setActiveSection('recent')}><Clock3 size={17} /> Recently viewed <span className="side-count">{recentResources.length}</span></button>
        {isTeacher ? <><button className={`side-link ${activeSection === 'requests' ? 'active' : ''}`} onClick={() => setActiveSection('requests')}><ClipboardList size={17} /> Requests <span className="side-count">{requests.filter((request) => request.status === 'Pending').length}</span></button><button className={`side-link ${activeSection === 'reports' ? 'active' : ''}`} onClick={() => setActiveSection('reports')}><ShieldAlert size={17} /> Reports <span className="side-count">{initialReports.filter((report) => report.status !== 'Resolved').length}</span></button></> : <button className={`side-link ${activeSection === 'requests' ? 'active' : ''}`} onClick={() => setActiveSection('requests')}><ClipboardList size={17} /> Request a resource <span className="side-count">{requests.length}</span></button>}
        <div className="sidebar-label category-label">CATEGORIES</div>
        <nav className="category-nav" aria-label="Resource categories">
          {categories.map((item, index) => <button key={item} className={`category-link ${category === item ? 'selected' : ''}`} onClick={() => { setCategory(item); setBookmarksOnly(false) }}><span className={`category-dot dot-${index}`} />{item}</button>)}
        </nav>
        {isTeacher && <div className="faculty-card"><div className="faculty-icon"><BookOpenCheck size={17} /></div><strong>Faculty workspace</strong><p>Keep your course materials in one place. Students see your highest-priority files first.</p><button className="faculty-upload" onClick={() => setUploadOpen(true)}><Plus size={15} /> Upload resource</button></div>}
        <div className="sidebar-bottom"><div className="sidebar-campus"><span className="campus-mark">S</span><span><strong>Campus library</strong><small>Shared learning space</small></span><ChevronDown size={15} /></div></div>
      </aside>

      <section className="main-area">
        <header className="topbar"><div className="mobile-brand brand"><span className="brand-mark"><LibraryBig size={18} /></span><span>Scholar<span>Space</span></span></div><div className="breadcrumb">Library <span>/</span> <strong>{bookmarksOnly ? 'My bookmarks' : category}</strong></div><div className="top-actions"><span className={`role-badge ${isTeacher ? 'teacher-badge' : ''}`}>{isTeacher ? <BookOpenCheck size={13} /> : <GraduationCap size={14} />}{isTeacher ? 'Teacher' : 'Student'}</span><button className="top-report-button" onClick={() => setReportingResource(null)}><ShieldAlert size={14} /> Report a problem</button><ThemeToggle initialTheme={theme} /><button className="avatar" aria-label={`Signed in as ${user.name}`}>{initials}</button><button className="icon-button signout-button" aria-label="Sign out" onClick={async () => { await authClient.signOut(); window.location.assign('/') }}><LogOut size={16} /></button></div></header>
        <nav className="mobile-feature-nav" aria-label="Library sections"><button className={activeSection === 'library' ? 'selected' : ''} onClick={() => { setActiveSection('library'); setBookmarksOnly(false) }}>Library</button><button className={activeSection === 'recent' ? 'selected' : ''} onClick={() => setActiveSection('recent')}>Recent</button>{isTeacher ? <><button className={activeSection === 'requests' ? 'selected' : ''} onClick={() => setActiveSection('requests')}>Requests</button><button className={activeSection === 'reports' ? 'selected' : ''} onClick={() => setActiveSection('reports')}>Reports</button></> : <button className={activeSection === 'requests' ? 'selected' : ''} onClick={() => setActiveSection('requests')}>Request</button>}</nav>
        <div className="content-wrap">
          {activeSection === 'recent' ? <RecentViewsPanel resources={recentResources} onView={onViewResource} onDownload={onDownload} /> : activeSection === 'requests' ? <RequestsPanel isTeacher={isTeacher} requests={requests} onRequest={() => setRequestOpen(true)} onCreated={saveRequest} /> : activeSection === 'reports' && isTeacher ? <ReportsPanel reports={reports} onReportsChange={setReports} /> : <>
          {!isTeacher && <div className="welcome-row"><div><div className="eyebrow">CAMPUS RESOURCE LIBRARY</div><h1>{bookmarksOnly ? 'Your saved resources' : 'Find your next breakthrough.'}</h1><p>{bookmarksOnly ? 'Your bookmarked study materials, ready when you are.' : `Welcome back, ${user.name.split(' ')[0]}. Here’s what your campus is sharing.`}</p></div></div>}
          {isTeacher && !bookmarksOnly && <FacultyDashboard name={user.name} userId={user.id} resources={resources} requests={requests} reports={reports} onUpload={() => setUploadOpen(true)} onNavigate={(section) => setActiveSection(section)} />}
          {(!isTeacher || bookmarksOnly) && <section className="insight-banner"><div className="insight-icon"><Sparkles size={17} /></div><div><strong>Priority-ranked for better learning</strong><p>Teacher-picked resources are ranked from 1–10, so the most important materials are always first.</p></div><span className="insight-decoration">10<span>/10</span></span></section>}
          <div className="library-heading"><div><h2>{bookmarksOnly ? 'Bookmarked' : category === 'All resources' ? 'Featured resources' : category}</h2><span>{filteredResources.length} {filteredResources.length === 1 ? 'resource' : 'resources'} {search && `matching “${search}”`}</span></div><div className="list-tools"><label className="search-box"><Search size={16} /><input aria-label="Search resources" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search courses, files…" /><kbd>/</kbd></label><button className="filter-button" onClick={() => { setCategory('All resources'); setSearch('') }} aria-label="Clear search and filters"><SlidersHorizontal size={16} /></button></div></div>
          <div className="mobile-category-pills" aria-label="Filter by category">{categories.map((item) => <button key={item} className={category === item ? 'selected' : ''} onClick={() => { setCategory(item); setBookmarksOnly(false) }}>{item}</button>)}</div>
          <div className="resource-grid">
            {filteredResources.map((resource, index) => {
              const Icon = fileIcon(resource.mimeType)
              return <article className="resource-card" key={resource.id}>
                <div className="resource-card-top"><div className={`file-type-icon file-color-${index % 4}`}><Icon size={19} /></div><span className="priority-pill"><span />{resource.priority}/10 priority</span><button className={`bookmark-button ${bookmarks.has(resource.id) ? 'is-saved' : ''}`} aria-label={bookmarks.has(resource.id) ? `Remove ${resource.title} from bookmarks` : `Bookmark ${resource.title}`} aria-pressed={bookmarks.has(resource.id)} onClick={() => onBookmark(resource.id)}><Bookmark size={17} fill={bookmarks.has(resource.id) ? 'currentColor' : 'none'} /></button></div>
                <div className="resource-course">{resource.course} <span>·</span> {resource.category}</div><h3>{resource.title}</h3><p className="resource-description">{resource.description || 'Shared by your teaching team for this course.'}</p>
                <div className="resource-byline"><span className="teacher-avatar">{resource.uploadedByName.split(/\s+/).map((part) => part[0]).slice(0, 2).join('').toUpperCase()}</span><span><strong>{resource.uploadedByName}</strong><small>Added {formatDate(resource.createdAt)}</small></span></div>
                <div className="resource-footer"><span>{formatSize(resource.fileSize)} <span className="footer-dot">·</span> {resource.downloadCount} downloads</span><div className="resource-actions"><a className="download-button" href={`/api/files/${encodeURIComponent(resource.id)}?inline=1`} target="_blank" rel="noopener noreferrer" onClick={() => void onViewResource(resource)}>Open <ArrowUpRight size={14} /></a><button className="download-button" onClick={() => onDownload(resource)}>Download <ArrowDownToLine size={14} /></button></div><button className="resource-report" onClick={() => setReportingResource(resource)} aria-label={`Report a problem with ${resource.title}`}>Report issue</button></div>
              </article>
            })}
            {!filteredResources.length && <div className="empty-state"><div className="empty-icon"><BookOpen size={22} /></div><h3>{bookmarksOnly ? 'No bookmarks yet' : 'No resources found'}</h3><p>{bookmarksOnly ? 'Save a resource with the bookmark icon and it will be waiting here.' : 'Try another search or category. Your next great study resource may be one click away.'}</p>{bookmarksOnly ? <button className="text-button" onClick={() => setBookmarksOnly(false)}>Explore all resources <ArrowRight size={15} /></button> : null}</div>}
          </div>
          <footer className="content-footer"><span>Showing priority-ranked campus resources</span></footer>
          </>}
        </div>
      </section>

      {toast && <div className="toast-message" role="status"><Check size={16} />{toast}</div>}
      {requestOpen && <RequestDialog onClose={() => setRequestOpen(false)} onCreated={saveRequest} notify={notify} />}
      {reportingResource !== undefined && <ReportDialog resource={reportingResource ?? null} onClose={() => setReportingResource(undefined)} notify={notify} />}
      {uploadOpen && <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setUploadOpen(false) }}><section className="upload-modal" role="dialog" aria-modal="true" aria-labelledby="upload-title"><div className="modal-head"><div><span className="eyebrow">FACULTY WORKSPACE</span><h2 id="upload-title">Share a resource</h2><p>Students will see higher-priority materials first.</p></div><button className="icon-button" onClick={() => setUploadOpen(false)} aria-label="Close upload dialog"><X size={18} /></button></div><form onSubmit={submitUpload} className="upload-form"><label className="form-field"><span>Resource title</span><input name="title" placeholder="e.g. Week 4 — Cell structure" required maxLength={120} /></label><div className="form-row"><label className="form-field"><span>Course</span><input name="course" placeholder="e.g. BIO 204" required maxLength={80} /></label><label className="form-field"><span>Category</span><select name="category" defaultValue="Lecture notes"><option>Lecture notes</option><option>Study guide</option><option>Past paper</option><option>Assignment</option><option>Reference</option></select></label></div><label className="form-field"><span>Description <small>Optional</small></span><textarea name="description" placeholder="What should students know about this file?" rows={2} maxLength={500} /></label><label className="priority-field"><span><strong>Priority</strong><b><span id="priority-readout">Set from 1 to 10</span></b></span><input name="priority" type="range" min="1" max="10" defaultValue="7" onChange={(event) => { const target = document.getElementById('priority-readout'); if (target) target.textContent = `${event.target.value} / 10` }} /><span className="range-labels"><small>1 · Helpful</small><small>10 · Essential</small></span></label><label className="dropzone"><UploadCloud size={22} /><strong>Choose a file to upload</strong><span>Any file type, up to 50 MB</span><input name="file" type="file" required /></label><div className="modal-actions"><button className="secondary-button" type="button" onClick={() => setUploadOpen(false)}>Cancel</button><button className="primary-button" type="submit" disabled={uploading}>{uploading ? 'Uploading…' : 'Publish resource'} <ArrowUpRight size={16} /></button></div></form></section></div>}
    </main>
  )
}
