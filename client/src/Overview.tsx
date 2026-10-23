import type { CSSProperties } from 'react';
import { ArrowRight, ArrowUpRight, Check, CheckCheck, Circle, Clock3, GraduationCap, Ticket, Wifi, Wrench } from 'lucide-react';
import type { Stats, User } from './types';
export function Banner({ user, onHelp }: { user: User; onHelp: () => void }) {
  return <div className="welcome-banner"><div><span className="banner-greeting">Hello, {user.name.split(' ')[0]} <span aria-hidden="true">↗</span></span><h2>Little things add up<br />to a better place.</h2><p>{user.role === 'admin' ? 'A clear update can turn a report into a resolution.' : 'A broken light. A Wi-Fi hiccup. You notice it. We help fix it.'}</p><button className="banner-link" onClick={onHelp}>How Campus Care works<ArrowRight size={15} /></button></div><div className="banner-art" aria-hidden="true"><div className="banner-grid" /><span className="floating-icon wrench"><Wrench size={28} /></span><div className="banner-building"><GraduationCap size={38} /><div>{Array.from({ length: 6 }, (_, i) => <i key={i} />)}</div></div><span className="floating-icon wifi"><Wifi size={24} /></span><div className="resolved-note"><span><Check size={18} /></span><div>Better, together.<small>One issue at a time.</small></div></div><span className="banner-star">✦</span></div><span className="banner-label">MADE FOR OUR CAMPUS</span></div>;
}
export function Statistics({ stats, admin }: { stats: Stats; admin: boolean }) {
  return <section className="stats-grid" aria-label="Report statistics">{[
    { label: 'Total reports', value: stats.total, icon: Ticket, color: 'neutral', sub: admin ? 'Across the campus' : 'Your voice in action' },
    { label: 'Open', value: stats.counts.Open, icon: Circle, color: 'amber', sub: 'Ready for a first look' },
    { label: 'In progress', value: stats.counts['In progress'], icon: Clock3, color: 'blue', sub: 'Good things in the works' },
    { label: 'Resolved & closed', value: stats.counts.Resolved + stats.counts.Closed, icon: CheckCheck, color: 'green', sub: 'A little better than before' },
  ].map(({ label, value, icon: Icon, color, sub }) => <article className="stat-card" key={label}><div><span>{label}</span><span className={'stat-icon ' + color}><Icon size={18} /></span></div><strong>{value}</strong><p>{sub}</p></article>)}</section>;
}
export function Insights({ stats, admin }: { stats: Stats; admin: boolean }) {
  const resolved = stats.counts.Resolved + stats.counts.Closed;
  const rate = stats.total ? Math.round(resolved / stats.total * 100) : 0;
  return <aside className="insights"><section className="impact-panel"><div className="insight-heading"><span className="eyebrow">{admin ? 'CAMPUS SNAPSHOT' : 'YOUR IMPACT'}</span><ArrowUpRight size={16} /></div><h2>Every fix matters.</h2><p>Small improvements.<br />A campus that feels better.</p><div className="progress-ring" style={{ '--progress': rate + '%' } as CSSProperties}><div><strong>{rate}<small>%</small></strong><span>resolved or closed</span></div></div><p className="impact-caption">{resolved} of {stats.total} reports are<br />resolved or closed.</p></section>
    <section className="categories-panel"><h3>Reports by category</h3><p>Where reports are coming from.</p>{stats.categories.length ? stats.categories.map(item => <div className="category-row" key={item._id}><div><span>{item._id}</span><strong>{item.count}</strong></div><div className="category-track"><span style={{ width: item.count / Math.max(1, ...stats.categories.map(value => value.count)) * 100 + '%' }} /></div></div>) : <p className="no-categories">Your categories will appear here after your first report.</p>}</section></aside>;
}
export function Help() {
  return <section className="help-page"><span className="eyebrow">A LITTLE GUIDANCE</span><h2>Good reports make a difference.</h2><p className="muted">Here’s how to help the campus team help you.</p><div className="help-grid">{[
    ['01', 'Notice something?', 'Report maintenance, classroom, connectivity, sanitation or campus safety issues. For immediate danger, contact campus security directly.'],
    ['02', 'Give a clear picture.', 'Use a specific title, an exact location and a description of what happened. Avoid sharing passwords or sensitive personal details.'],
    ['03', 'Follow the progress.', 'Open a report to see its status, assigned team and activity history, or add a comment.'],
    ['04', 'Understand the workflow.', 'Open → In progress → Resolved → Closed. Admins can close an open duplicate, reopen a closed report, or return a resolved report to progress.'],
    ['05', 'Keep details up to date.', 'You can edit or delete a report while it is Open. Once work starts, use comments to provide additional information.'],
    ['06', 'Know who can see it.', 'Students see only their own reports. Administrators can view all reports and manage assignments, priorities and status.'],
  ].map(([number, title, body]) => <article className="help-card" key={number}><span>{number}</span><h3>{title}</h3><p>{body}</p></article>)}</div><div className="help-footer"><GraduationCap size={22} /><p>Campus Care · A MERN stack project by Albert Jaison<br /><span>Sahrdaya College of Engineering and Technology</span></p></div></section>;
}

