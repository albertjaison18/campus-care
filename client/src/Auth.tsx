import { useState } from 'react';
import type { FormEvent } from 'react';
import { ArrowRight, CheckCircle2, GraduationCap, ShieldCheck } from 'lucide-react';
import { api, json } from './api';
import type { User } from './types';
import { Alert, Brand, errorMessage } from './ui';
export default function Auth({ onLogin }: { onLogin: (user: User) => void }) {
  const [register, setRegister] = useState(false);
  const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(''); setBusy(true);
    const form = new FormData(event.currentTarget);
    const body = { email: form.get('email'), password: form.get('password'), ...(register ? { name: form.get('name') } : {}) };
    try { const result = await api<{ user: User }>('/auth/' + (register ? 'register' : 'login'), json('POST', body)); onLogin(result.user); }
    catch (err) { setError(errorMessage(err)); } finally { setBusy(false); }
  }
  return <main className="auth-page"><section className="auth-story"><Brand light /><div className="auth-pitch"><span className="eyebrow light-text">SMALL REPORTS. REAL CHANGE.</span><h1>Your campus.<br />A little better,<br /><em>every day.</em></h1><p>See something that needs attention? Let the right people know, and follow the progress from report to resolution.</p>
    <div className="campus-art" aria-hidden="true"><div className="art-orbit" /><div className="art-building"><GraduationCap size={52} /><div className="windows">{Array.from({ length: 6 }, (_, i) => <span key={i} />)}</div></div><div className="art-ticket"><CheckCircle2 size={22} /><div>One less issue.<small>One better campus.</small></div></div><span className="art-spark">✦</span></div>
    </div><div className="auth-footer"><span className="mini-dot" />Built for a campus that cares.</div></section>
    <section className="auth-form-area"><div className="auth-form"><span className="eyebrow">WELCOME TO CAMPUS CARE</span><h2>{register ? 'Make yourself at home.' : 'Good to have you back.'}</h2><p>{register ? 'Create a student account to report and track campus issues.' : 'Sign in to pick up where you left off.'}</p>
    <form onSubmit={submit}>{register && <label>Full name<input name="name" autoComplete="name" minLength={2} maxLength={80} placeholder="Your full name" required /></label>}
      <label>Email address<input name="email" type="email" autoComplete="email" maxLength={254} placeholder="you@college.edu" required /></label>
      <label>Password<input name="password" type="password" autoComplete={register ? 'new-password' : 'current-password'} minLength={register ? 12 : 1} maxLength={72} placeholder={register ? 'At least 12 characters' : 'Enter your password'} required /></label>
      {register && <p className="field-hint">Use at least 12 characters. New accounts have student access.</p>}{error && <Alert>{error}</Alert>}
      <button className="button primary auth-submit" disabled={busy}>{busy ? 'Please wait…' : register ? 'Create account' : 'Sign in'}<ArrowRight size={17} /></button>
    </form><p className="auth-switch">{register ? 'Already part of Campus Care?' : 'New to Campus Care?'} <button className="text-button" onClick={() => { setRegister(!register); setError(''); }}>{register ? 'Sign in' : 'Create an account'}</button></p>
    <div className="auth-note"><ShieldCheck size={20} /><p>Your reports are visible to you and campus administrators. Please leave out sensitive personal information.</p></div>
    </div><span className="auth-college">Sahrdaya College of Engineering and Technology</span></section></main>;
}

