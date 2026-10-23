import { useState } from 'react';
import type { FormEvent } from 'react';
import { ArrowRight } from 'lucide-react';
import { api, json } from './api';
import type { Issue, Meta } from './types';
import { Alert, errorMessage, Modal } from './ui';
export default function ReportForm({ meta, existing, onSave, onClose }: { meta: Meta; existing?: Issue; onSave: (issue: Issue) => void; onClose: () => void }) {
  const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError('');
    const data = Object.fromEntries(new FormData(event.currentTarget));
    try { const result = await api<{ issue: Issue }>(existing ? '/issues/' + existing._id : '/issues', json(existing ? 'PATCH' : 'POST', data)); onSave(result.issue); }
    catch (err) { setError(errorMessage(err)); } finally { setBusy(false); }
  }
  return <Modal title={existing ? 'Edit your report' : 'Let’s make it better.'} onClose={onClose}><form className="report-form" onSubmit={submit}>
    <p className="muted">Tell us what needs attention. A little detail helps the team resolve it faster.</p>
    <label>Issue title<input name="title" minLength={5} maxLength={120} defaultValue={existing?.title} placeholder="e.g. Projector not working in Room 204" required /></label>
    <div className="form-row"><label>Category<select name="category" defaultValue={existing?.category || ''} required><option value="" disabled>Select a category</option>{meta.categories.map(value => <option key={value}>{value}</option>)}</select></label>
    <label>Priority<select name="priority" defaultValue={existing?.priority || 'Medium'}>{meta.priorities.map(value => <option key={value}>{value}</option>)}</select></label></div>
    <label>Location<input name="location" minLength={2} maxLength={120} defaultValue={existing?.location} placeholder="Building, floor, room or landmark" required /></label>
    <label>Description<textarea name="description" rows={5} minLength={15} maxLength={3000} defaultValue={existing?.description} placeholder="What happened? When did you notice it? Include anything that could help." required /></label>
    <p className="field-hint">For urgent threats to safety, contact campus security directly. This tracker is not an emergency service.</p>
    {error && <Alert>{error}</Alert>}<div className="modal-actions"><button type="button" className="button secondary" onClick={onClose}>Cancel</button><button className="button primary" disabled={busy}>{busy ? 'Saving…' : existing ? 'Save changes' : 'Submit report'}<ArrowRight size={16} /></button></div>
  </form></Modal>;
}

