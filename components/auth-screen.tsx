'use client'

import { useState, type FormEvent } from 'react'
import { authClient } from '@/lib/auth-client'
import { ArrowRight, BookOpenCheck, GraduationCap, LibraryBig, ShieldCheck } from 'lucide-react'

export function AuthScreen() {
  const [mode, setMode] = useState<'signup' | 'signin'>('signup')
  const [role, setRole] = useState<'student' | 'teacher'>('student')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setBusy(true)
    const form = new FormData(event.currentTarget)
    const email = String(form.get('email') ?? '').trim()
    const password = String(form.get('password') ?? '')
    const name = String(form.get('name') ?? '').trim()

    try {
      const result = mode === 'signup'
        ? await authClient.signUp.email({ email, password, name, role })
        : await authClient.signIn.email({ email, password })

      if (result.error) {
        setError(mode === 'signup'
          ? 'We could not create your account. Check your details, or sign in if you have already registered.'
          : 'Email or password not recognized. Try again or create an account.')
        return
      }

      window.location.assign('/')
    } catch {
      setError('The account service could not be reached. Check your connection and try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="auth-shell">
      <section className="auth-aside">
        <a className="brand brand-on-dark" href="/" aria-label="Smart Library home">
          <span className="brand-mark"><LibraryBig size={20} /></span>
          <span>Smart <span className="brand-light">Library</span></span>
        </a>
        <div className="auth-aside-copy">
          <span className="eyebrow eyebrow-light">YOUR CAMPUS, IN ONE PLACE</span>
          <h1>Good resources.<br />Better learning.</h1>
          <p>Find the notes, guides, and past papers your teachers recommend — all in one thoughtfully organized library.</p>
        </div>
        <div className="auth-proof"><ShieldCheck size={17} /><span>Course materials shared by your teaching community</span></div>
        <div className="auth-deco auth-deco-one" /><div className="auth-deco auth-deco-two" />
      </section>
      <section className="auth-panel">
        <div className="auth-panel-inner">
          <div className="mobile-brand brand"><span className="brand-mark"><LibraryBig size={19} /></span><span>Smart <span>Library</span></span></div>
          <div className="auth-heading">
            <span className="eyebrow">{mode === 'signup' ? 'GET STARTED' : 'WELCOME BACK'}</span>
            <h2>{mode === 'signup' ? 'Create your account' : 'Sign in to Smart Library'}</h2>
            <p>{mode === 'signup' ? 'Join your campus resource library in a moment.' : 'Your course materials are right where you left them.'}</p>
          </div>
          <form className="auth-form" onSubmit={submit}>
            {mode === 'signup' && <label className="form-field"><span>Full name</span><input autoComplete="name" name="name" placeholder="e.g. Taylor Morgan" required maxLength={80} /></label>}
            <label className="form-field"><span>Email address</span><input autoComplete="email" name="email" type="email" placeholder="you@college.edu" required /></label>
            <label className="form-field"><span>Password</span><input autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} name="password" type="password" minLength={8} placeholder="At least 8 characters" required /></label>
            {mode === 'signup' && <fieldset className="role-picker">
              <legend>I&apos;m joining as</legend>
              <button type="button" className={`role-option ${role === 'student' ? 'selected' : ''}`} onClick={() => setRole('student')} aria-pressed={role === 'student'}><GraduationCap size={18} /><span><strong>Student</strong><small>Browse, bookmark &amp; download</small></span></button>
              <button type="button" className={`role-option ${role === 'teacher' ? 'selected' : ''}`} onClick={() => setRole('teacher')} aria-pressed={role === 'teacher'}><BookOpenCheck size={18} /><span><strong>Teacher</strong><small>Share &amp; prioritize resources</small></span></button>
            </fieldset>}
            {error && <p className="form-error" role="alert">{error}</p>}
            <button className="primary-button auth-submit" type="submit" disabled={busy}>{busy ? 'Please wait…' : mode === 'signup' ? 'Create account' : 'Sign in'} <ArrowRight size={17} /></button>
          </form>
          <p className="auth-switch">{mode === 'signup' ? 'Already have an account?' : 'New to Smart Library?'} <button type="button" onClick={() => { setError(''); setMode(mode === 'signup' ? 'signin' : 'signup') }}>{mode === 'signup' ? 'Sign in' : 'Create an account'}</button></p>
          <p className="auth-note">By continuing, you agree to use shared materials for learning and teaching.</p>
        </div>
      </section>
    </main>
  )
}
