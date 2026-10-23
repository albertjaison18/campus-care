import { useState } from 'react';
import type { FormEvent } from 'react';
import { ArrowUpRight, Check, Clock3, MapPin, MessageSquare, Trash2 } from 'lucide-react';
import { api, json } from './api';
import type { Issue, Meta, Status, User } from './types';
import { Alert, Badge, date, errorMessage, initials, Modal, PriorityBadge, shortId } from './ui';
const transitions: Record<Status, Status[]> = { Open: ['Open', 'In progress', 'Closed'], 'In progress': ['In progress', 'Open', 'Resolved'], Resolved: ['Resolved', 'In progress', 'Closed'], Closed: ['Closed', 'Open'] };
export default function Detail({ issue, user, meta, onClose, onUpdate, onEdit, onDelete }: {
  issue: Issue; user: User; meta: Meta; onClose: () => void; onUpdate: (issue: Issue) => void; onEdit: () => void; onDelete: () => void;
}) {
  const [error, setError] = useState(''); const [busy, setBusy] = useState(false); const [deleting, setDeleting] = useState(false);
  async function comment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError('');
    const form = event.currentTarget;
    try { const result = await api<{ issue: Issue }>('/issues/' + issue._id + '/comments', json('POST', { message: new FormData(form).get('message') })); onUpdate(result.issue); form.reset(); }
    catch (err) { setError(errorMessage(err)); } finally { setBusy(false); }
  }
  async function manage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError('');
    try { const result = await api<{ issue: Issue }>('/issues/' + issue._id + '/manage', json('PATCH', Object.fromEntries(new FormData(event.currentTarget)))); onUpdate(result.issue); }
    catch (err) { setError(errorMessage(err)); } finally { setBusy(false); }
  }
  async function remove() {
    setBusy(true); setError('');
    try { await api('/issues/' + issue._id, { method: 'DELETE' }); onDelete(); }
    catch (err) { setError(errorMessage(err)); } finally { setBusy(false); }
  }
  return <Modal title="Report details" onClose={onClose} wide><div className="detail-content">
    <div className="detail-id"><span>{shortId(issue._id)}</span><Badge status={issue.status} /></div><h3 className="detail-title">{issue.title}</h3>
    <div className="detail-meta"><span><MapPin size={15} />{issue.location}</span><span><Clock3 size={15} />{date(issue.createdAt)}</span></div>
    <div className="detail-facts"><div><small>CATEGORY</small><strong>{issue.category}</strong></div><div><small>PRIORITY</small><PriorityBadge value={issue.priority} /></div><div><small>ASSIGNED TO</small><strong>{issue.assignee}</strong></div></div>
    <h4>What needs attention</h4><p className="description">{issue.description}</p>
    <p className="reporter-line"><span className="avatar small">{initials(issue.reporter.name)}</span>Reported by {issue.reporter.name}</p>
    {user.role === 'admin' && <form className="manage-form" onSubmit={manage} key={issue.updatedAt}><h4>Manage this report</h4><div className="form-row"><label>Status<select name="status" defaultValue={issue.status}>{transitions[issue.status].map(value => <option key={value}>{value}</option>)}</select></label><label>Priority<select name="priority" defaultValue={issue.priority}>{meta.priorities.map(value => <option key={value}>{value}</option>)}</select></label></div>
      <label>Assign to<select name="assignee" defaultValue={issue.assignee}>{meta.assignees.map(value => <option key={value}>{value}</option>)}</select></label><button className="button primary" disabled={busy}>Update report<Check size={16} /></button></form>}
    {issue.status === 'Open' && <div className="detail-edit"><button className="text-button" onClick={onEdit}>Edit report details</button><button className="text-button danger" onClick={() => setDeleting(true)}><Trash2 size={14} />Delete report</button></div>}
    {deleting && <div className="delete-confirm" role="alert"><p>Delete this open report and its comments? This cannot be undone.</p><div><button className="button secondary" disabled={busy} onClick={() => setDeleting(false)}>Keep report</button><button className="button danger-button" disabled={busy} onClick={remove}>Delete permanently</button></div></div>}
    {error && <Alert>{error}</Alert>}
    <h4 className="activity-heading">Activity & updates <span>{issue.history?.length || 0}</span></h4>
    <ol className="timeline">{issue.history?.map(item => <li key={item._id}><span className={'timeline-marker ' + item.kind}>{item.kind === 'comment' ? <MessageSquare size={13} /> : <Check size={12} />}</span><div><strong>{item.actor}</strong><p>{item.message}</p><time dateTime={item.at}>{new Date(item.at).toLocaleString('en-IN')}</time></div></li>)}</ol>
    <form onSubmit={comment} className="comment-form"><label htmlFor="comment">Add an update<textarea id="comment" name="message" maxLength={1000} rows={3} placeholder="Ask a question or share an update…" required /></label><button className="button secondary" disabled={busy}>Post comment<ArrowUpRight size={16} /></button></form>
  </div></Modal>;
}

