import { useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowUpRight, ChevronLeft, ChevronRight, ListFilter, MapPin, Search, Ticket, X } from 'lucide-react';
import { api } from './api';
import type { Issue, IssueList, Meta } from './types';
import { Alert, Badge, date, errorMessage, PriorityBadge, shortId } from './ui';
export default function Reports({ admin, overview, meta, revision, onOpen, onNew, onViewAll }: {
  admin: boolean; overview: boolean; meta: Meta; revision: number; onOpen: (issue: Issue) => void; onNew: () => void; onViewAll: () => void;
}) {
  const [list, setList] = useState<IssueList>({ items: [], total: 0, page: 1, pages: 1 });
  const [search, setSearch] = useState(''); const [query, setQuery] = useState('');
  const [status, setStatus] = useState(''); const [category, setCategory] = useState(''); const [priority, setPriority] = useState('');
  const [sort, setSort] = useState('newest'); const [page, setPage] = useState(1); const [filters, setFilters] = useState(false);
  const [loading, setLoading] = useState(true); const [error, setError] = useState(''); const [retry, setRetry] = useState(0); const sequence = useRef(0);
  useEffect(() => { const timer = setTimeout(() => { setQuery(search); setPage(1); }, 300); return () => clearTimeout(timer); }, [search]);
  useEffect(() => {
    const id = ++sequence.current; setLoading(true); setError('');
    const params = new URLSearchParams({ page: String(page), limit: '8', sort });
    for (const [key, value] of Object.entries({ status, category, priority, search: query })) if (value) params.set(key, value);
    api<IssueList>('/issues?' + params).then(result => { if (id === sequence.current) { setList(result); if (page > result.pages) setPage(result.pages); } })
      .catch(err => { if (id === sequence.current) setError(errorMessage(err)); }).finally(() => { if (id === sequence.current) setLoading(false); });
    return () => { sequence.current++; };
  }, [page, sort, status, category, priority, query, revision, retry]);
  const filtered = Boolean(search || status || category || priority);
  function clear() { setSearch(''); setStatus(''); setCategory(''); setPriority(''); setPage(1); }
  return <section className="reports-panel" aria-labelledby="reports-title">
    <div className="panel-heading"><div><h2 id="reports-title">{overview ? 'Recent reports' : admin ? 'All campus reports' : 'My reports'}<span className="count-pill">{list.total}</span></h2><p>{admin ? 'A little attention goes a long way.' : 'Every report is a step towards a better campus.'}</p></div>{overview && <button className="text-button subtle" onClick={onViewAll}>View all<ArrowUpRight size={15} /></button>}</div>
    <div className="table-toolbar"><label className="search-input"><Search size={17} /><span className="sr-only">Search reports</span><input placeholder="Search reports…" value={search} onChange={event => setSearch(event.target.value)} />{search && <button className="icon-button" aria-label="Clear search" onClick={() => setSearch('')}><X size={14} /></button>}</label>
      <button className={'button filter-button ' + (filters ? 'selected' : '')} aria-expanded={filters} onClick={() => setFilters(!filters)}><ListFilter size={16} />Filters{(status || category || priority) && <span className="filter-dot" />}</button>
      <label className="sort-control"><span className="sr-only">Sort reports</span><ArrowDown size={14} /><select value={sort} onChange={event => { setSort(event.target.value); setPage(1); }}><option value="newest">Newest first</option><option value="oldest">Oldest first</option><option value="updated">Recently updated</option></select></label>
    </div>
    {filters && <div className="filter-row"><label>Status<select value={status} onChange={event => { setStatus(event.target.value); setPage(1); }}><option value="">All statuses</option>{meta.statuses.map(value => <option key={value}>{value}</option>)}</select></label><label>Category<select value={category} onChange={event => { setCategory(event.target.value); setPage(1); }}><option value="">All categories</option>{meta.categories.map(value => <option key={value}>{value}</option>)}</select></label><label>Priority<select value={priority} onChange={event => { setPriority(event.target.value); setPage(1); }}><option value="">All priorities</option>{meta.priorities.map(value => <option key={value}>{value}</option>)}</select></label>{filtered && <button className="text-button" onClick={clear}>Clear</button>}</div>}
    {error ? <div className="panel-error"><Alert>{error}</Alert><button className="button secondary" onClick={() => setRetry(value => value + 1)}>Try again</button></div> : loading ? <div className="table-loading" role="status"><div className="spinner" /><p>Finding your reports…</p></div> : !list.items.length ? <div className="empty-state"><span><Ticket size={30} /></span><h3>{filtered ? 'No matching reports.' : 'Your first small step starts here.'}</h3><p>{filtered ? 'Try another search or clear the filters.' : 'Notice something that needs a fix? Let the campus team know.'}</p><button className="button secondary" onClick={filtered ? clear : onNew}>{filtered ? 'Clear filters' : 'Report an issue'}</button></div> :
      <div className="table-scroll"><table className="issue-table"><thead><tr><th scope="col">ISSUE</th><th scope="col">STATUS</th><th scope="col">PRIORITY</th><th scope="col">REPORTED</th><th scope="col"><span className="sr-only">Open report</span></th></tr></thead><tbody>{list.items.map(issue => <tr key={issue._id}><td><button className="issue-title" onClick={() => onOpen(issue)}>{issue.title}</button><span className="issue-location"><MapPin size={12} />{issue.location}</span><span className="issue-category">{issue.category}</span></td><td><Badge status={issue.status} /></td><td><PriorityBadge value={issue.priority} /></td><td className="date-cell">{date(issue.createdAt)}<small>{shortId(issue._id)}</small></td><td><button className="icon-button open-report" aria-label={'Open report: ' + issue.title} onClick={() => onOpen(issue)}><ArrowUpRight size={17} /></button></td></tr>)}</tbody></table></div>}
    <div className="table-footer"><span>{list.total === 0 ? '0 reports' : 'Showing ' + ((list.page - 1) * 8 + 1) + '–' + Math.min(list.page * 8, list.total) + ' of ' + list.total + ' reports'}</span><div><button className="icon-button" aria-label="Previous page" disabled={page <= 1 || loading} onClick={() => setPage(value => value - 1)}><ChevronLeft size={16} /></button><span>{page} / {list.pages}</span><button className="icon-button" aria-label="Next page" disabled={page >= list.pages || loading} onClick={() => setPage(value => value + 1)}><ChevronRight size={16} /></button></div></div>
  </section>;
}

