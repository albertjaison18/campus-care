import { useCallback, useEffect, useState } from 'react';
import { ChevronDown, ChevronRight, GraduationCap, HelpCircle, LayoutDashboard, LogOut, Plus, Sparkles, Ticket } from 'lucide-react';
import { api, ApiError } from './api';
import type { Issue, Meta, Stats, User } from './types';
import Auth from './Auth';
import Detail from './Detail';
import ReportForm from './ReportForm';
import Reports from './Reports';
import { Banner, Help, Insights, Statistics } from './Overview';
import { Alert, Brand, errorMessage, initials, Toast } from './ui';
type Page = 'dashboard' | 'reports' | 'help';
export default function App() {
  const [user, setUser] = useState<User | null>(null); const [booting, setBooting] = useState(true); const [bootError, setBootError] = useState('');
  const [meta, setMeta] = useState<Meta | null>(null); const [stats, setStats] = useState<Stats | null>(null);
  const [page, setPage] = useState<Page>('dashboard'); const [error, setError] = useState('');
  const [notice, setNotice] = useState(''); const [selected, setSelected] = useState<Issue | null>(null);
  const [form, setForm] = useState<'new' | 'edit' | null>(null); const [revision, setRevision] = useState(0);
  const boot = useCallback(async () => {
    setBooting(true); setBootError('');
    try { const result = await api<{ user: User }>('/auth/me'); setUser(result.user); }
    catch (err) { if (!(err instanceof ApiError && err.status === 401)) setBootError(errorMessage(err)); }
    finally { setBooting(false); }
  }, []);
  useEffect(() => { void boot(); }, [boot]);
  useEffect(() => {
    if (!user) return;
    let active = true; setError('');
    Promise.all([api<Meta>('/meta'), api<Stats>('/issues/stats')]).then(([options, totals]) => { if (active) { setMeta(options); setStats(totals); } })
      .catch(err => { if (active) { setError(errorMessage(err)); if (err instanceof ApiError && err.status === 401) setUser(null); } });
    return () => { active = false; };
  }, [user, revision]);
  useEffect(() => { if (notice) { const timer = setTimeout(() => setNotice(''), 4500); return () => clearTimeout(timer); } }, [notice]);
  function refresh(message: string) { setRevision(value => value + 1); setNotice(message); }
  async function openIssue(issue: Issue) {
    setError('');
    try { const result = await api<{ issue: Issue }>('/issues/' + issue._id); setSelected(result.issue); }
    catch (err) { setError(errorMessage(err)); }
  }
  async function logout() {
    try { await api('/auth/logout', { method: 'POST' }); setUser(null); setMeta(null); setStats(null); setSelected(null); setForm(null); setPage('dashboard'); }
    catch (err) { setError(errorMessage(err)); }
  }
  if (booting) return <main className="boot-screen"><Brand /><div className="spinner" /><p>Getting your campus ready…</p></main>;
  if (bootError) return <main className="boot-screen"><Brand /><Alert>{bootError}</Alert><button className="button primary" onClick={() => void boot()}>Try again</button></main>;
  if (!user) return <Auth onLogin={value => { setUser(value); setPage('dashboard'); }} />;
  const admin = user.role === 'admin';
  return <div className="app-shell"><a className="skip-link" href="#main">Skip to content</a>
    <aside className="sidebar"><Brand /><div className="workspace-label"><GraduationCap size={17} /><div>Sahrdaya Campus<small>{admin ? 'Administration workspace' : 'Student workspace'}</small></div><ChevronDown size={14} /></div>
      <span className="nav-label">WORKSPACE</span><nav aria-label="Main navigation">
        <button aria-label="Overview" aria-current={page === 'dashboard' ? 'page' : undefined} className={page === 'dashboard' ? 'active' : ''} onClick={() => setPage('dashboard')}><LayoutDashboard size={19} /><span>Overview</span></button>
        <button aria-label={admin ? 'All reports' : 'My reports'} aria-current={page === 'reports' ? 'page' : undefined} className={page === 'reports' ? 'active' : ''} onClick={() => setPage('reports')}><Ticket size={19} /><span>{admin ? 'All reports' : 'My reports'}</span>{stats && <b>{stats.total}</b>}</button>
        <button aria-label="Help and guidelines" aria-current={page === 'help' ? 'page' : undefined} className={page === 'help' ? 'active' : ''} onClick={() => setPage('help')}><HelpCircle size={19} /><span>Help & guidelines</span></button>
      </nav><div className="sidebar-bottom"><div className="sidebar-tip"><span className="tip-icon"><Sparkles size={20} /></span><h3>A small report.<br />A better campus.</h3><p>Your voice helps make our everyday spaces better.</p><button onClick={() => setForm('new')} disabled={!meta}>Make a difference<span>↗</span></button></div>
      <div className="sidebar-user"><span className="avatar">{initials(user.name)}</span><div><strong>{user.name}</strong><small>{admin ? 'Administrator' : 'Student'}</small></div><button className="icon-button" title="Sign out" aria-label="Sign out" onClick={() => void logout()}><LogOut size={17} /></button></div></div>
    </aside>
    <div className="main-shell"><header className="topbar"><div><span className="breadcrumb">Workspace</span><ChevronRight size={13} /><strong>{page === 'dashboard' ? 'Overview' : page === 'help' ? 'Help & guidelines' : admin ? 'All reports' : 'My reports'}</strong></div><div className="topbar-right"><span className="campus-status"><span />Campus workspace</span><span className="topbar-divider" /><span className="avatar small">{initials(user.name)}</span></div></header>
      <main id="main" className="main-content">
        {error && <div className="global-error"><Alert>{error}</Alert><button className="button secondary" onClick={() => setRevision(value => value + 1)}>Retry</button></div>}
        {page === 'help' ? <Help /> : <>
          <div className="page-heading"><div><span className="eyebrow">{admin ? 'CAMPUS OPERATIONS' : 'YOUR CAMPUS, YOUR VOICE'}</span><h1>{page === 'reports' ? admin ? 'Every report. One place.' : 'Your reports, at a glance.' : 'A better campus starts here.'}<span className="heading-dot" /></h1><p>{admin ? 'Keep things moving. Give every campus issue the attention it deserves.' : 'Report an issue, follow its progress, and help your campus thrive.'}</p></div><button className="button primary" onClick={() => setForm('new')} disabled={!meta}><Plus size={18} />Report an issue</button></div>
          {page === 'dashboard' && <><Banner user={user} onHelp={() => setPage('help')} />{stats && <Statistics stats={stats} admin={admin} />}</>}
          <div className={'content-grid ' + (page === 'reports' ? 'full-width' : '')}>{meta ? <Reports key={page} admin={admin} overview={page === 'dashboard'} meta={meta} revision={revision} onOpen={issue => void openIssue(issue)} onNew={() => setForm('new')} onViewAll={() => setPage('reports')} /> : !error && <div className="table-loading" role="status">Loading your workspace…</div>}
            {page === 'dashboard' && stats && <Insights stats={stats} admin={admin} />}</div>
        </>}
        <footer className="page-footer"><span>Made for a campus that cares.</span><span>Campus Care <span className="footer-dot">·</span> {new Date().getFullYear()}</span></footer>
      </main>
    </div>
    {notice && <Toast message={notice} dismiss={() => setNotice('')} />}
    {selected && !form && meta && <Detail issue={selected} user={user} meta={meta} onClose={() => setSelected(null)} onUpdate={issue => { setSelected(issue); refresh('Report updated.'); }} onEdit={() => setForm('edit')} onDelete={() => { setSelected(null); refresh('Report deleted.'); }} />}
    {form && meta && <ReportForm meta={meta} existing={form === 'edit' ? selected || undefined : undefined} onClose={() => setForm(null)} onSave={issue => { const editing = form === 'edit'; setForm(null); setSelected(issue); refresh(editing ? 'Your changes are saved.' : 'Your report is in. Thank you for making a difference.'); }} />}
  </div>;
}


