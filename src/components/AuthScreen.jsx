import { useState } from 'react'
import api, { getErrorMessage } from '../api'

export default function AuthScreen({ onAuthenticated, notice }) {
  const [registering, setRegistering] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(notice || '')

  async function submit(event) {
    event.preventDefault()
    setError('')
    const form = new FormData(event.currentTarget)
    const payload = {
      email: form.get('email'),
      password: form.get('password'),
    }
    if (registering) {
      payload.organizationName = form.get('organizationName')
      payload.confirmPassword = form.get('confirmPassword')
      if (payload.password !== payload.confirmPassword) {
        setError('Passwords do not match.')
        return
      }
    }
    if (payload.password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }

    setBusy(true)
    try {
      const { data } = await api.post(`/auth/${registering ? 'register' : 'login'}`, payload)
      onAuthenticated(data.data)
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-brand"><span className="brand-mark">S</span><span>stockflow</span></div>
      <section className="auth-card">
        <div className="auth-overline">INVENTORY, IN CONTROL</div>
        <h1>{registering ? 'Create your workspace' : 'Welcome back'}</h1>
        <p className="auth-subtitle">{registering ? 'Set up your inventory workspace.' : 'Sign in to manage your products and stock.'}</p>
        {error && <div className="alert alert-error" role="alert">{error}</div>}
        <form className="form-stack" onSubmit={submit} autoComplete="on">
          {registering && <label>Organization name<input name="organizationName" required minLength="1" maxLength="120" autoComplete="organization" placeholder="Acme Supply Co." /></label>}
          <label>Work email<input name="email" type="email" required maxLength="254" autoComplete="username" placeholder="you@company.com" /></label>
          <label>Password<input name="password" type="password" required minLength="8" maxLength="72" autoComplete={registering ? 'new-password' : 'current-password'} aria-describedby="password-hint" placeholder="Enter your password" /><small id="password-hint" className="auth-field-hint">Use at least 8 characters.</small></label>
          {registering && <label>Confirm password<input name="confirmPassword" type="password" required minLength="8" maxLength="72" autoComplete="new-password" placeholder="Repeat your password" /></label>}
          <button className="button button-primary auth-submit" type="submit" disabled={busy}>
            {busy ? 'Please wait…' : registering ? 'Create workspace' : 'Sign in'}
          </button>
        </form>
        <div className="auth-switch">
          {registering ? 'Already have a workspace?' : 'New to StockFlow?'}
          <button type="button" onClick={() => { setError(''); setRegistering((value) => !value) }}>
            {registering ? 'Sign in' : 'Create an account'}
          </button>
        </div>
      </section>
      <p className="auth-footer">Secure, organization-scoped inventory management</p>
    </main>
  )
}
