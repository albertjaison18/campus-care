import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { Check, Plus, X } from 'lucide-react';
import type { Priority, Status } from './types';
export const initials = (name: string) => name.split(' ').map(word => word[0]).slice(0, 2).join('').toUpperCase();
export const shortId = (id: string) => 'CC-' + id.slice(-6).toUpperCase();
export const date = (value: string) => new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short' }).format(new Date(value));
export const errorMessage = (error: unknown) => error instanceof Error ? error.message : 'Something went wrong.';
export function Brand({ light = false }: { light?: boolean }) {
  return <div className={'brand ' + (light ? 'light' : '')}><span className="brand-mark"><Plus size={24} strokeWidth={3} /></span><span>campus<span className="brand-care">care</span><small>A better campus, together.</small></span></div>;
}
export function Badge({ status }: { status: Status }) { return <span className={'badge ' + status.toLowerCase().replaceAll(' ', '-')}><span />{status}</span>; }
export function PriorityBadge({ value }: { value: Priority }) { return <span className={'priority ' + value.toLowerCase()}><span />{value}</span>; }
export function Alert({ children }: { children: ReactNode }) { return <div className="alert" role="alert">{children}</div>; }
export function Modal({ title, children, onClose, wide = false }: { title: string; children: ReactNode; onClose: () => void; wide?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose); closeRef.current = onClose;
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const focusable = () => Array.from(ref.current?.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex="0"]') || []);
    focusable()[0]?.focus();
    function key(event: KeyboardEvent) {
      if (event.key === 'Escape') closeRef.current();
      if (event.key === 'Tab') {
        const elements = focusable(); const first = elements[0]; const last = elements.at(-1);
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
    }
    document.addEventListener('keydown', key);
    return () => { document.body.style.overflow = overflow; document.removeEventListener('keydown', key); previous?.focus(); };
  }, []);
  return <div className="modal-backdrop" onClick={event => { if (event.target === event.currentTarget) onClose(); }}>
    <div ref={ref} className={'modal ' + (wide ? 'wide' : '')} role="dialog" aria-modal="true" aria-labelledby="dialog-title">
      <div className="modal-header"><h2 id="dialog-title">{title}</h2><button className="icon-button" aria-label="Close dialog" onClick={onClose}><X size={21} /></button></div>{children}
    </div>
  </div>;
}
export function Toast({ message, dismiss }: { message: string; dismiss: () => void }) {
  return <div className="toast" role="status"><Check size={18} /><span>{message}</span><button className="icon-button" aria-label="Dismiss notification" onClick={dismiss}><X size={16} /></button></div>;
}

