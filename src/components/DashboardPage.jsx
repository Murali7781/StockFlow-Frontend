import { useEffect, useState } from 'react'
import api, { getErrorMessage } from '../api'
import Icon from './Icon'

const number = new Intl.NumberFormat('en-US')
const date = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

function StatCard({ label, value, note, icon, tone }) {
  return (
    <article className={`stat-card ${tone}`}>
      <div className="stat-top">
        <span className="stat-label">{label}</span>
        <span className="stat-icon"><Icon name={icon} size={19} /></span>
      </div>
      <strong className="stat-value">{value}</strong>
      <span className="stat-note">{note}</span>
    </article>
  )
}

function LowStockTable({ products, defaultThreshold, loading, onNavigate }) {
  function status(product) {
    const quantity = Number(product.quantityOnHand)
    if (quantity === 0) return ['Out of stock', 'status-out']
    if (quantity <= Number(product.lowStockThreshold ?? defaultThreshold)) {
      return ['Low stock', 'status-low']
    }
    return ['In stock', 'status-healthy']
  }

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
            <tr><th>Product name</th><th>SKU</th><th>Quantity on hand</th><th>Low stock threshold</th><th>Stock status</th></tr>
          </thead>
          <tbody>
            {loading
              ? <tr><td className="table-state" colSpan="5">Loading low stock items…</td></tr>
              : products.length
                ? products.map((product) => {
                    const [label, tone] = status(product)
                    return (
                      <tr key={product.id}>
                        <td><strong>{product.name}</strong></td>
                        <td>{product.sku}</td>
                        <td>{number.format(product.quantityOnHand)}</td>
                        <td>{number.format(product.lowStockThreshold ?? defaultThreshold)}</td>
                        <td><span className={`status-pill ${tone}`}>{label}</span></td>
                      </tr>
                    )
                  })
                : <tr>
                  <td className="table-state" colSpan="5">
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

function RecentProducts({ products, loading, onNavigate }) {
  return (
    <section className="panel recent-products-panel">
      <div className="panel-heading">
        <div>
          <h2>Recently added products</h2>
          <p>Your latest additions to the catalog</p>
        </div>
        <button className="panel-link" type="button" onClick={() => onNavigate('Products')}>
          View all products <Icon name="arrow" size={14} />
        </button>
      </div>
      <div className="table-scroll">
        <table>
          <thead>
            <tr><th>Product name</th><th>SKU</th><th>Quantity</th><th>Selling price</th><th>Date added</th></tr>
          </thead>
          <tbody>
            {loading
              ? <tr><td className="table-state" colSpan="5">Loading recent products…</td></tr>
              : products.length
                ? products.map((product) => (
                  <tr key={product.id}>
                    <td><strong>{product.name}</strong></td>
                    <td>{product.sku}</td>
                    <td>{number.format(product.quantityOnHand)}</td>
                    <td>{product.sellingPrice == null
                      ? '—'
                      : new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(product.sellingPrice))}</td>
                    <td>{product.createdAt ? date.format(new Date(product.createdAt)) : '—'}</td>
                  </tr>
                ))
                : <tr><td className="table-state" colSpan="5">
                  <strong>No products yet</strong>
                  <span>Add a product to see it in your recent activity.</span>
                </td></tr>}
          </tbody>
        </table>
      </div>
    </section>
  )
}

export default function DashboardPage({ onNavigate, onAddProduct, user }) {
  const [summary, setSummary] = useState(null)
  const [recentProducts, setRecentProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [recentLoading, setRecentLoading] = useState(true)
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
    api.get('/products', {
      params: { page: 1, limit: 5, sortBy: 'createdAt', sortOrder: 'DESC' },
    }).then(({ data }) => {
      if (active) setRecentProducts(data.data.products || [])
    }).catch((error) => {
      if (active) setLoadError(getErrorMessage(error))
    }).finally(() => {
      if (active) setRecentLoading(false)
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
          <h1>Welcome back!</h1>
          <p className="page-description">Here’s the latest inventory overview for <strong>{organizationName}</strong>.</p>
        </div>
        <button className="button button-primary dashboard-add-button" type="button" onClick={onAddProduct}>
          <Icon name="plus" /> Add Product
        </button>
      </div>

      {loadError && <div className="alert alert-error" role="alert">
        <span>{loadError}</span>
        <button
          type="button"
          className="text-button"
          disabled={loading}
          onClick={() => {
            setLoading(true)
            setRecentLoading(true)
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
        />
        <StatCard
          label="Total stock quantity"
          value={value(summary?.totalStockQuantity)}
          note="Units currently on hand"
          icon="inventory"
          tone="stat-purple"
        />
        <StatCard
          label="Low stock items"
          value={value(summary?.lowStockCount)}
          note="Products at or below threshold"
          icon="warning"
          tone="stat-orange"
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
      <RecentProducts products={recentProducts} loading={recentLoading} onNavigate={onNavigate} />
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
