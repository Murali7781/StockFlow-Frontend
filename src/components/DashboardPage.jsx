import { useEffect, useState } from 'react'
import api, { getErrorMessage } from '../api'
import Icon from './Icon'

const number = new Intl.NumberFormat('en-US')

function greeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

function StatCard({ label, value, note, icon, tone, onClick }) {
  return (
    <button className={`stat-card ${tone}`} type="button" onClick={onClick}>
      <div className="stat-top">
        <span className="stat-label">{label}</span>
        <span className="stat-icon"><Icon name={icon} size={19} /></span>
      </div>
      <strong className="stat-value">{value}</strong>
      <span className="stat-note">{note}</span>
    </button>
  )
}

function LowStockTable({ products, defaultThreshold, loading, onNavigate }) {
  return (
    <section className="panel dashboard-table-panel">
      <div className="panel-heading">
        <div>
          <h2>Low stock items</h2>
          <p>Products at or below their reorder threshold</p>
        </div>
        <button className="panel-link" type="button" onClick={() => onNavigate('Products')}>
          View products <Icon name="arrow" size={14} />
        </button>
      </div>
      <div className="table-scroll">
        <table>
          <thead>
            <tr><th>Name</th><th>SKU</th><th>Quantity on hand</th><th>Threshold</th></tr>
          </thead>
          <tbody>
            {loading
              ? <tr><td className="table-state" colSpan="4">Loading low stock items…</td></tr>
              : products.length
                ? products.map((product) => (
                  <tr key={product.id}>
                    <td><strong>{product.name}</strong></td>
                    <td>{product.sku}</td>
                    <td>{number.format(product.quantityOnHand)}</td>
                    <td>{number.format(product.lowStockThreshold ?? defaultThreshold)}</td>
                  </tr>
                ))
                : <tr>
                  <td className="table-state" colSpan="4">
                    <strong>No low stock items</strong>
                    <span>Products at or below their threshold will appear here.</span>
                  </td>
                </tr>}
          </tbody>
        </table>
      </div>
    </section>
  )
}

export default function DashboardPage({ onNavigate, user }) {
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [refresh, setRefresh] = useState(0)

  useEffect(() => {
    let active = true
    api.get('/dashboard').then(({ data }) => {
      if (active) {
        setSummary(data.data)
        setLoadError('')
      }
    }).catch((error) => {
      if (active) setLoadError(getErrorMessage(error))
    }).finally(() => {
      if (active) setLoading(false)
    })
    return () => { active = false }
  }, [refresh])

  const organizationName = user?.organization?.name || 'your workspace'
  const value = (item) => loading || !summary ? '—' : number.format(item || 0)

  return (
    <section className="page-section dashboard-page">
      <div className="dashboard-welcome">
        <div>
          <p className="eyebrow">INVENTORY OVERVIEW</p>
          <h1>{greeting()}, {organizationName}</h1>
          <p className="page-description">A clear view of your products and stock.</p>
        </div>
      </div>

      {loadError && <div className="alert alert-error" role="alert">
        <span>{loadError}</span>
        <button
          type="button"
          className="text-button"
          disabled={loading}
          onClick={() => {
            setLoading(true)
            setRefresh((value) => value + 1)
          }}
        >
          Retry
        </button>
      </div>}

      <div className="stats-grid dashboard-stats-grid">
        <StatCard
          label="Total products"
          value={value(summary?.totalProducts)}
          note="Products in your catalog"
          icon="products"
          tone="stat-blue"
          onClick={() => onNavigate('Products')}
        />
        <StatCard
          label="Total stock quantity"
          value={value(summary?.totalStockQuantity)}
          note="Units currently on hand"
          icon="inventory"
          tone="stat-purple"
          onClick={() => onNavigate('Products')}
        />
      </div>

      <LowStockTable
        products={summary?.lowStockProducts || []}
        defaultThreshold={summary?.defaultLowStockThreshold}
        loading={loading}
        onNavigate={onNavigate}
      />
      {summary?.lowStockProductsTruncated && (
        <p className="dashboard-footnote">
          Showing {summary.lowStockProducts.length} of {number.format(summary.lowStockCount)} low stock items.
        </p>
      )}
      {!loading && summary?.totalProducts === 0 && (
        <div className="empty-panel">
          <span>Add your first product from the Products page to start tracking inventory.</span>
          <button type="button" className="button button-primary button-small" onClick={() => onNavigate('Products')}>
            <Icon name="plus" size={14} /> Go to products
          </button>
        </div>
      )}
    </section>
  )
}
