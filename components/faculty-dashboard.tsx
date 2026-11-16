'use client'

import { ArrowRight, BookOpenCheck, ClipboardList, FileUp, ShieldAlert, TrendingUp } from 'lucide-react'
import type { ReportRecord, RequestRecord, ResourceRecord } from '@/components/library-workflows'

type FacultySection = 'requests' | 'reports'

export function FacultyDashboard({
  name,
  userId,
  resources,
  requests,
  reports,
  onUpload,
  onNavigate,
}: {
  name: string
  userId: string
  resources: ResourceRecord[]
  requests: RequestRecord[]
  reports: ReportRecord[]
  onUpload: () => void
  onNavigate: (section: FacultySection) => void
}) {
  const facultyResources = resources.filter((resource) => resource.uploadedBy === userId)
  const downloads = facultyResources.reduce((total, resource) => total + resource.downloadCount, 0)
  const pendingRequests = requests.filter((request) => request.status === 'Pending').length
  const unresolvedReports = reports.filter((report) => report.status !== 'Resolved').length

  return (
    <section className="faculty-dashboard" aria-labelledby="faculty-dashboard-title">
      <div className="faculty-dashboard-heading">
        <div>
          <span className="eyebrow">FACULTY OVERVIEW</span>
          <h2 id="faculty-dashboard-title">Your teaching hub, {name.split(' ')[0]}</h2>
          <p>A clear view of your shared materials and the students who need your help.</p>
        </div>
        <button className="primary-button" onClick={onUpload}><FileUp size={15} /> Upload a resource</button>
      </div>

      <div className="faculty-metrics" aria-label="Faculty library metrics">
        <article className="faculty-metric"><span className="faculty-metric-icon metric-library"><BookOpenCheck size={17} /></span><span className="faculty-metric-label">Your resources</span><strong>{facultyResources.length}</strong><small>Shared with your campus</small></article>
        <article className="faculty-metric"><span className="faculty-metric-icon metric-activity"><TrendingUp size={17} /></span><span className="faculty-metric-label">Resource downloads</span><strong>{downloads}</strong><small>Across your materials</small></article>
        <button className="faculty-metric faculty-metric-action" onClick={() => onNavigate('requests')}><span className="faculty-metric-icon metric-requests"><ClipboardList size={17} /></span><span className="faculty-metric-label">Pending requests</span><strong>{pendingRequests}</strong><small>Student materials to review <ArrowRight size={12} /></small></button>
        <button className="faculty-metric faculty-metric-action" onClick={() => onNavigate('reports')}><span className="faculty-metric-icon metric-reports"><ShieldAlert size={17} /></span><span className="faculty-metric-label">Open reports</span><strong>{unresolvedReports}</strong><small>Library issues to resolve <ArrowRight size={12} /></small></button>
      </div>

      <div className="faculty-dashboard-bottom">
        <article className="faculty-next-step">
          <div className="faculty-section-title"><div><span className="eyebrow">KEEP THINGS MOVING</span><h3>Needs your attention</h3></div><span className="attention-count">{pendingRequests + unresolvedReports} open</span></div>
          <button className="faculty-attention-row" onClick={() => onNavigate('requests')}><span className="attention-icon attention-request"><ClipboardList size={16} /></span><span><strong>Student requests</strong><small>{pendingRequests ? `${pendingRequests} pending request${pendingRequests === 1 ? '' : 's'} waiting` : 'All student requests are up to date'}</small></span><ArrowRight size={15} /></button>
          <button className="faculty-attention-row" onClick={() => onNavigate('reports')}><span className="attention-icon attention-report"><ShieldAlert size={16} /></span><span><strong>Reported problems</strong><small>{unresolvedReports ? `${unresolvedReports} issue${unresolvedReports === 1 ? '' : 's'} need review` : 'No unresolved library reports'}</small></span><ArrowRight size={15} /></button>
        </article>
        <aside className="faculty-tip"><span className="faculty-tip-icon"><BookOpenCheck size={18} /></span><span className="eyebrow">A BETTER LIBRARY STARTS HERE</span><h3>Make your next upload count.</h3><p>Add a clear course and topic to help students find the right material faster.</p><button onClick={onUpload}>Share a resource <ArrowRight size={14} /></button></aside>
      </div>
    </section>
  )
}
