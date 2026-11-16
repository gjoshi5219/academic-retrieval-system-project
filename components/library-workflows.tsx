'use client'

import { useState, type FormEvent } from 'react'
import { ArrowDownToLine, ArrowUpRight, FileText, Plus, Send, ShieldAlert } from 'lucide-react'
import { createProblemReport, createResourceRequest, updateProblemReportStatus, updateResourceRequestStatus } from '@/app/actions/library'

export type ResourceRecord = {
  id: string
  title: string
  course: string
  category: string
  description: string
  mimeType: string
  fileName: string
  fileSize: number
  priority: number
  uploadedBy: string
  uploadedByName: string
  createdAt: Date | string
  downloadCount: number
  viewedAt?: Date | string
}

export type RequestRecord = {
  id: string
  userId: string
  requesterName: string
  title: string
  course: string
  details: string
  status: string
  createdAt: Date | string
}

export type ReportRecord = {
  id: string
  reporterId: string
  reporterName: string
  resourceId: string | null
  resourceTitle: string
  course: string
  reason: string
  details: string
  status: string
  createdAt: Date | string
}

const dateLabel = (value: Date | string) => new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(new Date(value))

export function RequestDialog({ onClose, onCreated, notify }: { onClose: () => void; onCreated: (request: RequestRecord) => void; notify: (message: string) => void }) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setError('')
    const form = new FormData(event.currentTarget)
    try {
      const request = await createResourceRequest({ title: String(form.get('title') ?? ''), course: String(form.get('course') ?? ''), details: String(form.get('details') ?? '') })
      onCreated(request)
      onClose()
      notify('Your request was sent to faculty.')
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not send the request.')
    } finally {
      setSaving(false)
    }
  }

  return <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}><section className="upload-modal workflow-modal" role="dialog" aria-modal="true" aria-labelledby="request-title"><div className="modal-head"><div><span className="eyebrow">STUDENT REQUEST</span><h2 id="request-title">Request a resource</h2><p>Ask faculty for missing notes, a PDF, or another course material.</p></div><button className="icon-button" type="button" onClick={onClose} aria-label="Close request dialog">×</button></div><form className="upload-form" onSubmit={submit}><label className="form-field"><span>What are you looking for?</span><input name="title" required maxLength={120} placeholder="e.g. Week 6 lecture notes" /></label><label className="form-field"><span>Course</span><input name="course" required maxLength={80} placeholder="e.g. BIO 204" /></label><label className="form-field"><span>Details <small>Optional</small></span><textarea name="details" rows={3} maxLength={1000} placeholder="Include a topic, chapter, or exam date if helpful." /></label>{error && <p className="form-error" role="alert">{error}</p>}<button className="primary-button modal-submit" disabled={saving} type="submit"><Send size={15} />{saving ? 'Sending…' : 'Send request'}</button></form></section></div>
}

export function ReportDialog({ resource, onClose, notify }: { resource: Pick<ResourceRecord, 'id' | 'title' | 'course'> | null; onClose: () => void; notify: (message: string) => void }) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setError('')
    const form = new FormData(event.currentTarget)
    try {
      await createProblemReport({
        resourceId: resource?.id,
        resourceTitle: resource?.title ?? String(form.get('title') ?? ''),
        course: resource?.course ?? String(form.get('course') ?? ''),
        reason: String(form.get('reason') ?? ''),
        details: String(form.get('details') ?? ''),
      })
      onClose()
      notify('Thanks — faculty has received your report.')
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not send the report.')
    } finally {
      setSaving(false)
    }
  }

  return <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}><section className="upload-modal workflow-modal" role="dialog" aria-modal="true" aria-labelledby="report-title"><div className="modal-head"><div><span className="eyebrow">LIBRARY FEEDBACK</span><h2 id="report-title">Report a problem</h2><p>Let faculty know if a file is broken, mislabeled, or missing.</p></div><button className="icon-button" type="button" onClick={onClose} aria-label="Close report dialog">×</button></div><form className="upload-form" onSubmit={submit}>{resource ? <div className="report-resource"><strong>{resource.title}</strong><span>{resource.course}</span></div> : <><label className="form-field"><span>Resource or document name</span><input name="title" required maxLength={120} placeholder="e.g. Week 6 lecture notes" /></label><label className="form-field"><span>Course</span><input name="course" required maxLength={80} placeholder="e.g. BIO 204" /></label></>}<label className="form-field"><span>What is the issue?</span><select name="reason" defaultValue="Broken PDF"><option>Broken PDF</option><option>Incorrect topic</option><option>Missing document</option></select></label><label className="form-field"><span>Details</span><textarea name="details" required rows={3} maxLength={1000} placeholder="Describe what happened or what is missing." /></label>{error && <p className="form-error" role="alert">{error}</p>}<button className="primary-button modal-submit" disabled={saving} type="submit"><ShieldAlert size={15} />{saving ? 'Sending…' : 'Submit report'}</button></form></section></div>
}

export function RequestsPanel({ isTeacher, requests, onRequest, onCreated }: { isTeacher: boolean; requests: RequestRecord[]; onRequest: () => void; onCreated: (request: RequestRecord) => void }) {
  const [error, setError] = useState('')
  const [updating, setUpdating] = useState<string | null>(null)

  async function setStatus(id: string, status: string) {
    const before = requests.find((request) => request.id === id)?.status
    setUpdating(id)
    setError('')
    try {
      await updateResourceRequestStatus(id, status)
      const current = requests.find((request) => request.id === id)
      if (current) onCreated({ ...current, status })
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not update this request.')
      const current = requests.find((request) => request.id === id)
      if (before && current) onCreated({ ...current, status: before })
    } finally {
      setUpdating(null)
    }
  }

  return <section className="workspace-panel"><div className="workspace-heading"><div><span className="eyebrow">{isTeacher ? 'FACULTY WORKSPACE' : 'YOUR LIBRARY'}</span><h2>{isTeacher ? 'Student resource requests' : 'Resource requests'}</h2><p>{isTeacher ? 'Review what students need and keep each request moving.' : 'Ask faculty for notes or a PDF, then check its progress here.'}</p></div>{!isTeacher && <button className="primary-button" onClick={onRequest}><Plus size={15} /> Request a resource</button>}</div>{error && <p className="form-error" role="alert">{error}</p>}{requests.length ? <div className="workflow-list">{requests.map((request) => <article className="workflow-row" key={request.id}><div className="workflow-icon"><FileText size={18} /></div><div className="workflow-copy"><div className="workflow-title-line"><h3>{request.title}</h3><span className={`status-pill status-${request.status.toLowerCase()}`}>{request.status}</span></div><p>{request.course}{isTeacher ? ` · Requested by ${request.requesterName}` : ''}</p>{request.details && <small>{request.details}</small>}<time dateTime={new Date(request.createdAt).toISOString()}>Requested {dateLabel(request.createdAt)}</time></div>{isTeacher && <label className="status-control"><span>Status</span><select aria-label={`Update ${request.title} status`} disabled={updating === request.id} value={request.status} onChange={(event) => void setStatus(request.id, event.target.value)}><option>Pending</option><option>Approved</option><option>Uploaded</option></select></label>}</article>)}</div> : <div className="workflow-empty"><FileText size={22} /><h3>No resource requests yet</h3><p>{isTeacher ? 'Student requests will appear here.' : 'Your requests and their status will show up here.'}</p></div>}</section>
}

export function ReportsPanel({ reports, onReportsChange }: { reports: ReportRecord[]; onReportsChange?: (reports: ReportRecord[]) => void }) {
  const [items, setItems] = useState(reports)
  const [error, setError] = useState('')
  const [updating, setUpdating] = useState<string | null>(null)

  async function setStatus(id: string, status: string) {
    const before = items.find((report) => report.id === id)?.status
    setUpdating(id)
    setError('')
    const updatedItems = items.map((report) => report.id === id ? { ...report, status } : report)
    setItems(updatedItems)
    onReportsChange?.(updatedItems)
    try {
      await updateProblemReportStatus(id, status)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not update this report.')
      if (before) {
        const restoredItems = items.map((report) => report.id === id ? { ...report, status: before } : report)
        setItems(restoredItems)
        onReportsChange?.(restoredItems)
      }
    } finally {
      setUpdating(null)
    }
  }

  return <section className="workspace-panel"><div className="workspace-heading"><div><span className="eyebrow">FACULTY WORKSPACE</span><h2>Reported problems</h2><p>Student reports about broken PDFs, incorrect topics, and missing documents.</p></div></div>{error && <p className="form-error" role="alert">{error}</p>}{items.length ? <div className="workflow-list">{items.map((report) => <article className="workflow-row report-row" key={report.id}><div className="workflow-icon report-icon"><ShieldAlert size={18} /></div><div className="workflow-copy"><div className="workflow-title-line"><h3>{report.reason}: {report.resourceTitle}</h3><span className={`status-pill status-${report.status.toLowerCase().replace(' ', '-')}`}>{report.status}</span></div><p>{report.course} · Reported by {report.reporterName}</p><small>{report.details}</small><time dateTime={new Date(report.createdAt).toISOString()}>Submitted {dateLabel(report.createdAt)}</time></div><label className="status-control"><span>Status</span><select aria-label={`Update ${report.reason} report status`} disabled={updating === report.id} value={report.status} onChange={(event) => void setStatus(report.id, event.target.value)}><option>Open</option><option>In review</option><option>Resolved</option></select></label></article>)}</div> : <div className="workflow-empty"><ShieldAlert size={22} /><h3>No reports to review</h3><p>New student reports will appear here.</p></div>}</section>
}

export function RecentViewsPanel({ resources, onView, onDownload }: { resources: ResourceRecord[]; onView: (resource: ResourceRecord) => void; onDownload: (resource: ResourceRecord) => void }) {
  return <section className="workspace-panel"><div className="workspace-heading"><div><span className="eyebrow">YOUR LIBRARY</span><h2>Recently viewed</h2><p>Pick up where you left off. Your latest eight resources are saved to your account.</p></div></div>{resources.length ? <div className="workflow-list">{resources.map((resource) => <article className="workflow-row recent-row" key={resource.id}><div className="workflow-icon"><FileText size={18} /></div><div className="workflow-copy"><h3>{resource.title}</h3><p>{resource.course}</p><time dateTime={new Date(resource.viewedAt ?? resource.createdAt).toISOString()}>Viewed {dateLabel(resource.viewedAt ?? resource.createdAt)}</time></div><div className="recent-actions"><a className="outline-button" href={`/api/files/${encodeURIComponent(resource.id)}?inline=1`} target="_blank" rel="noopener noreferrer" onClick={() => onView(resource)}>Open <ArrowUpRight size={14} /></a><button className="outline-button" onClick={() => onDownload(resource)}>Download <ArrowDownToLine size={14} /></button></div></article>)}</div> : <div className="workflow-empty"><FileText size={22} /><h3>No recent views yet</h3><p>Open a resource from the library and it will be saved here.</p></div>}</section>
}
