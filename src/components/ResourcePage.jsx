import { useEffect, useState } from 'react'
import api, { getErrorMessage } from '../api'
import Icon from './Icon'
import Modal from './Modal'

function initialValues(fields, item) {
  return Object.fromEntries(fields.map((field) => [
    field.name,
    item?.[field.name] ?? field.defaultValue ?? '',
  ]))
}

function Field({ field, value, onChange }) {
  const common = {
    id: `field-${field.name}`,
    name: field.name,
    required: field.required,
    maxLength: field.maxLength,
    value,
    onChange: (event) => onChange(field.name, event.target.value),
  }
  return (
    <label className={field.full ? 'form-field form-full' : 'form-field'} htmlFor={common.id}>
      {field.label}
      {field.multiline ? (
        <textarea {...common} rows="3" placeholder={field.placeholder || ''} />
      ) : (
        <input
          {...common}
          type={field.type || 'text'}
          min={field.type === 'number' ? field.min ?? 0 : undefined}
          step={field.type === 'number' ? field.step || '1' : undefined}
          placeholder={field.placeholder || ''}
        />
      )}
    </label>
  )
}

export default function ResourcePage({ config, onNotify }) {
  const [items, setItems] = useState([])
  const [defaultLowStockThreshold, setDefaultLowStockThreshold] = useState(null)
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 })
  const [page, setPage] = useState(1)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState(config.defaultSort || 'name')
  const [sortOrder, setSortOrder] = useState('ASC')
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [saving, setSaving] = useState(false)
  const [modalItem, setModalItem] = useState(undefined)
  const [values, setValues] = useState({})
  const [formError, setFormError] = useState('')
  const [refresh, setRefresh] = useState(0)

  const fields = config.fields

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setPage(1)
      setSearch(searchInput.trim())
    }, 250)
    return () => window.clearTimeout(timer)
  }, [searchInput])

  useEffect(() => {
    let active = true
    api.get(config.path, {
      params: { page, limit: 10, search, sortBy, sortOrder },
    }).then(({ data }) => {
      if (!active) return
      const payload = data.data
      setItems(payload.products || payload.items || [])
      setPagination(payload.pagination || { page: 1, pages: 1, total: 0 })
      setLoadError('')
    }).catch((error) => {
      if (active) {
        setLoadError(getErrorMessage(error))
        onNotify(getErrorMessage(error), 'error')
      }
    }).finally(() => {
      if (active) setLoading(false)
    })
    return () => { active = false }
  }, [config.path, page, search, sortBy, sortOrder, refresh, onNotify])

  useEffect(() => {
    let active = true
    api.get('/settings')
      .then(({ data }) => {
        if (active) setDefaultLowStockThreshold(data.data.defaultLowStockThreshold)
      })
      .catch((error) => {
        if (active) onNotify(getErrorMessage(error), 'error')
      })
    return () => { active = false }
  }, [refresh, onNotify])

  function openForm(item) {
    setModalItem(item || null)
    setValues(initialValues(fields, item))
    setFormError('')
  }

  async function save(event) {
    event.preventDefault()
    setSaving(true)
    setFormError('')
    const payload = {}
    for (const field of fields) {
      const value = values[field.name]
      if (field.type === 'number') {
        payload[field.name] = value === '' && !field.required ? null : Number(value)
      } else {
        payload[field.name] = value === '' && !field.required ? null : value
      }
    }

    try {
      if (modalItem) await api.put(`${config.path}/${modalItem.id}`, payload)
      else await api.post(config.path, payload)
      setModalItem(undefined)
      setRefresh((value) => value + 1)
      onNotify(`${config.singular} ${modalItem ? 'updated' : 'created'} successfully`)
    } catch (error) {
      setFormError(getErrorMessage(error))
    } finally {
      setSaving(false)
    }
  }

  async function remove(item) {
    if (!window.confirm(`Delete “${item.name}”? This action cannot be undone.`)) return
    try {
      await api.delete(`${config.path}/${item.id}`)
      setRefresh((value) => value + 1)
      onNotify(`${config.singular} deleted`)
    } catch (error) {
      onNotify(getErrorMessage(error), 'error')
    }
  }

  function toggleSort(field) {
    if (!config.sortable.includes(field)) return
    if (sortBy === field) setSortOrder((value) => value === 'ASC' ? 'DESC' : 'ASC')
    else {
      setSortBy(field)
      setSortOrder('ASC')
    }
    setPage(1)
  }

  return (
    <section className="page-section">
      <div className="page-heading">
        <div><p className="eyebrow">{config.eyebrow}</p><h1>{config.title}</h1><p className="page-description">{config.description}</p></div>
        <button className="button button-primary" type="button" onClick={() => openForm()}>
          <Icon name="plus" /> Add {config.singular}
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
            setRefresh((value) => value + 1)
          }}
        >
          Retry
        </button>
      </div>}

      <div className="panel data-panel">
        <div className="table-toolbar">
          <div className="table-title"><strong>{config.title}</strong><span>{pagination.total} records</span></div>
          <label className="search-field"><Icon name="search" /><input value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder={`Search ${config.title.toLowerCase()}…`} aria-label={`Search ${config.title}`} /></label>
        </div>
        <div className="table-scroll">
          <table>
            <thead><tr>
              {config.columns.map((column) => <th key={column.key} className={config.sortable.includes(column.key) ? 'sortable' : ''}>
                {config.sortable.includes(column.key)
                  ? <button type="button" onClick={() => toggleSort(column.key)}>{column.label}{sortBy === column.key && <span className="sort-indicator">{sortOrder === 'ASC' ? '↑' : '↓'}</span>}</button>
                  : column.label}
              </th>)}
              <th className="actions-heading">Actions</th>
            </tr></thead>
            <tbody>
              {loading ? <tr><td className="table-state" colSpan={config.columns.length + 1}>Loading {config.title.toLowerCase()}…</td></tr>
                : loadError ? <tr><td className="table-state" colSpan={config.columns.length + 1}><strong>Could not load {config.title.toLowerCase()}</strong><span>Use Retry to try again.</span></td></tr>
                : items.length === 0 ? <tr><td className="table-state" colSpan={config.columns.length + 1}>
                  <strong>{search ? 'No matching records' : `No ${config.title.toLowerCase()} yet`}</strong>
                  <span>{search ? 'Try another search.' : `Add your first ${config.singular.toLowerCase()} to get started.`}</span>
                </td></tr>
                  : items.map((item) => <tr key={item.id}>
                    {config.columns.map((column) => <td key={column.key}>{column.render ? column.render(item, undefined, defaultLowStockThreshold) : item[column.key] || '—'}</td>)}
                    <td className="row-actions">
                      <button type="button" className="text-button" onClick={() => openForm(item)}>Edit</button>
                      <button type="button" className="text-button danger-text" onClick={() => remove(item)}>Delete</button>
                    </td>
                  </tr>)}
            </tbody>
          </table>
        </div>
        <div className="pagination">
          <span>Page {pagination.page || page} of {Math.max(pagination.pages || 1, 1)}</span>
          <div><button type="button" className="button button-secondary button-small" disabled={page <= 1 || loading} onClick={() => setPage((value) => value - 1)}>Previous</button>
            <button type="button" className="button button-secondary button-small" disabled={page >= (pagination.pages || 1) || loading} onClick={() => setPage((value) => value + 1)}>Next</button></div>
        </div>
      </div>

      {modalItem !== undefined && <Modal title={`${modalItem ? 'Edit' : 'Add'} ${config.singular}`} onClose={() => setModalItem(undefined)}>
        {formError && <div className="alert alert-error" role="alert">{formError}</div>}
        <form className="entity-form" onSubmit={save}>
          {fields.map((field) => <Field key={field.name} field={field} value={values[field.name] ?? ''} onChange={(name, value) => setValues((current) => ({ ...current, [name]: value }))} />)}
          <div className="modal-actions form-full">
            <button type="button" className="button button-secondary" onClick={() => setModalItem(undefined)}>Cancel</button>
            <button type="submit" className="button button-primary" disabled={saving}>{saving ? 'Saving…' : modalItem ? 'Save changes' : `Create ${config.singular}`}</button>
          </div>
        </form>
      </Modal>}
    </section>
  )
}
