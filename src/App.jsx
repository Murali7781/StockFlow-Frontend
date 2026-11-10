import { useCallback, useEffect, useState } from 'react'
import api, { getErrorMessage } from './api'
import AuthScreen from './components/AuthScreen'
import DashboardPage from './components/DashboardPage'
import Icon from './components/Icon'
import ResourcePage from './components/ResourcePage'
import './App.css'

const navigation = [
  { label: 'Dashboard', icon: 'dashboard' },
  { label: 'Products', icon: 'products' },
  { label: 'Settings', icon: 'settings' },
]

const productConfig = {
  path: '/products',
  title: 'Products',
  singular: 'Product',
  eyebrow: 'PRODUCT CATALOG',
  description: 'Manage product details, pricing, and stock levels.',
  defaultSort: 'name',
  sortable: ['name', 'sku', 'quantityOnHand', 'sellingPrice', 'createdAt'],
  columns: [
    { key: 'name', label: 'Product' },
    { key: 'sku', label: 'SKU' },
    {
      key: 'quantityOnHand',
      label: 'Quantity',
      render: (item) => Number(item.quantityOnHand).toLocaleString(),
    },
    {
      key: 'status',
      label: 'Low stock',
      render: (item, _unused, defaultThreshold) => {
        const threshold = item.lowStockThreshold ?? defaultThreshold
        if (threshold === null || threshold === undefined) return '—'
        return Number(item.quantityOnHand) <= Number(threshold)
          ? <span className="status-pill status-low">Low stock</span>
          : <span className="status-pill status-healthy">In stock</span>
      },
    },
    {
      key: 'sellingPrice',
      label: 'Selling price',
      render: (item) => item.sellingPrice === null || item.sellingPrice === undefined
        ? '—'
        : new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
        }).format(Number(item.sellingPrice)),
    },
  ],
  fields: [
    { name: 'name', label: 'Product name', required: true, maxLength: 160 },
    { name: 'sku', label: 'SKU', required: true, maxLength: 80 },
    { name: 'quantityOnHand', label: 'Quantity on hand', type: 'number', min: 0, defaultValue: 0 },
    { name: 'lowStockThreshold', label: 'Low stock threshold', type: 'number', min: 0 },
    { name: 'costPrice', label: 'Cost price', type: 'number', step: '0.01', min: 0 },
    { name: 'sellingPrice', label: 'Selling price', type: 'number', step: '0.01', min: 0 },
    { name: 'description', label: 'Description', multiline: true, full: true, maxLength: 10000 },
  ],
}

function clearStoredSession() {
  localStorage.removeItem('stockflow.token')
  localStorage.removeItem('stockflow.user')
}

function readSession() {
  const token = localStorage.getItem('stockflow.token')
  const storedUser = localStorage.getItem('stockflow.user')
  if (!token || !storedUser) return null

  try {
    const tokenPayload = token.split('.')[1]
      ?.replace(/-/g, '+')
      .replace(/_/g, '/')
    if (!tokenPayload) throw new Error('Invalid access token')
    const claims = JSON.parse(atob(tokenPayload.padEnd(Math.ceil(tokenPayload.length / 4) * 4, '=')))
    if (!Number.isFinite(claims.exp) || claims.exp * 1000 <= Date.now()) {
      clearStoredSession()
      localStorage.setItem('stockflow.authNotice', 'Your session expired. Please sign in again.')
      return null
    }
    return { token, user: JSON.parse(storedUser) }
  } catch {
    clearStoredSession()
    localStorage.setItem('stockflow.authNotice', 'Please sign in again to continue.')
    return null
  }
}

function SettingsPage({ onNotify }) {
  const [threshold, setThreshold] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [loadAttempt, setLoadAttempt] = useState(0)

  useEffect(() => {
    let active = true
    api.get('/settings').then(({ data }) => {
      if (active) {
        setThreshold(String(data.data.defaultLowStockThreshold))
        setError('')
      }
    }).catch((requestError) => {
      if (active) setError(getErrorMessage(requestError))
    }).finally(() => {
      if (active) setLoading(false)
    })
    return () => { active = false }
  }, [loadAttempt])

  async function save(event) {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      await api.patch('/settings', { defaultLowStockThreshold: Number(threshold) })
      onNotify('Inventory settings saved')
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="page-section">
      <div className="page-heading">
        <div>
          <p className="eyebrow">PREFERENCES</p>
          <h1>Settings</h1>
          <p className="page-description">Set the default stock threshold for your organization.</p>
        </div>
      </div>
      {error && <div className="alert alert-error" role="alert">{error}</div>}
      {error && loading === false && !threshold && <button
        type="button"
        className="text-button"
        onClick={() => {
          setLoading(true)
          setLoadAttempt((attempt) => attempt + 1)
        }}
      >
        Retry loading settings
      </button>}
      <section className="panel settings-panel">
        <div className="settings-title">
          <span className="settings-icon"><Icon name="inventory" /></span>
          <div>
            <h2>Inventory defaults</h2>
            <p>Products are low stock at or below their effective threshold.</p>
          </div>
        </div>
        <form className="settings-form" onSubmit={save}>
          <label>
            Default low stock threshold
            <span>Used when a product does not have its own threshold.</span>
            <input
              type="number"
              min="0"
              max="4294967295"
              step="1"
              required
              disabled={loading || Boolean(error && !threshold)}
              value={threshold}
              onChange={(event) => setThreshold(event.target.value)}
            />
          </label>
          <button type="submit" className="button button-primary" disabled={saving || loading || !threshold}>
            {loading ? 'Loading…' : saving ? 'Saving…' : 'Save settings'}
          </button>
        </form>
      </section>
    </section>
  )
}

export default function App() {
  const [session, setSession] = useState(readSession)
  const [activePage, setActivePage] = useState('Dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [toast, setToast] = useState(null)
  const [authNotice, setAuthNotice] = useState(() => {
    const notice = localStorage.getItem('stockflow.authNotice') || ''
    localStorage.removeItem('stockflow.authNotice')
    return notice
  })

  const notify = useCallback((message, type = 'success') => {
    setToast({ message, type, id: Date.now() })
  }, [])

  useEffect(() => {
    if (!toast) return undefined
    const timer = window.setTimeout(() => setToast(null), 4200)
    return () => window.clearTimeout(timer)
  }, [toast])

  useEffect(() => {
    const interceptor = api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401 && session) {
          clearStoredSession()
          setSession(null)
          setAuthNotice('Your session expired. Please sign in again.')
        }
        return Promise.reject(error)
      },
    )
    return () => api.interceptors.response.eject(interceptor)
  }, [session])

  function authenticated(result) {
    localStorage.setItem('stockflow.token', result.token)
    localStorage.setItem('stockflow.user', JSON.stringify(result.user))
    setSession({ token: result.token, user: result.user })
    setAuthNotice('')
    setActivePage('Dashboard')
  }

  function signOut() {
    clearStoredSession()
    setSession(null)
    setActivePage('Dashboard')
  }

  function navigate(page) {
    setActivePage(page)
    setSidebarOpen(false)
  }

  if (!session) return <AuthScreen onAuthenticated={authenticated} notice={authNotice} />

  return (
    <div className="app-shell">
      {sidebarOpen && <button className="sidebar-backdrop" aria-label="Close navigation" onClick={() => setSidebarOpen(false)} />}
      <aside className={`sidebar${sidebarOpen ? ' sidebar-open' : ''}`}>
        <div className="brand"><span className="brand-mark">S</span><span className="brand-word">stockflow</span></div>
        <div className="workspace-switcher">
          <div className="workspace-avatar">{(session.user.organization?.name || 'S').slice(0, 1).toUpperCase()}</div>
          <div className="workspace-copy">
            <strong>{session.user.organization?.name || 'Workspace'}</strong>
            <span>Inventory workspace</span>
          </div>
        </div>
        <nav className="side-nav" aria-label="Main navigation">
          <div className="nav-group-label">WORKSPACE</div>
          {navigation.map((item) => (
            <button
              key={item.label}
              type="button"
              className={`nav-item${activePage === item.label ? ' nav-active' : ''}`}
              aria-current={activePage === item.label ? 'page' : undefined}
              onClick={() => navigate(item.label)}
            >
              <Icon name={item.icon} size={18} /><span>{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="user-profile">
          <div className="user-avatar">{session.user.email.slice(0, 1).toUpperCase()}</div>
          <div className="user-copy">
            <strong>{session.user.email}</strong>
            <span>Workspace owner</span>
          </div>
          <button type="button" className="profile-logout" aria-label="Sign out" title="Sign out" onClick={signOut}>
            <Icon name="logout" size={17} />
          </button>
        </div>
      </aside>

      <div className="main-area">
        <header className="topbar">
          <button type="button" className="mobile-menu icon-button" aria-label="Open navigation" onClick={() => setSidebarOpen(true)}>
            <Icon name="menu" />
          </button>
          <div className="breadcrumb">
            <span>Workspace</span><span className="breadcrumb-separator">/</span><strong>{activePage}</strong>
          </div>
          <div className="topbar-actions">
            <span className="today-label">{new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
            <span className="topbar-divider" />
            <button type="button" className="topbar-user" aria-label="Open settings" title="Open settings" onClick={() => navigate('Settings')}>
              {session.user.email.slice(0, 1).toUpperCase()}
            </button>
          </div>
        </header>
        <main className="page-content">
          {activePage === 'Dashboard' && <DashboardPage onNavigate={navigate} user={session.user} />}
          {activePage === 'Products' && <ResourcePage
            config={productConfig}
            onNotify={notify}
          />}
          {activePage === 'Settings' && <SettingsPage onNotify={notify} />}
        </main>
      </div>
      {toast && <div key={toast.id} className={`toast toast-${toast.type}`} role={toast.type === 'error' ? 'alert' : 'status'}>
        <span className="toast-indicator">{toast.type === 'error' ? '!' : '✓'}</span>
        <span>{toast.message}</span>
        <button type="button" aria-label="Dismiss notification" onClick={() => setToast(null)}>
          <Icon name="close" size={16} />
        </button>
      </div>}
    </div>
  )
}
