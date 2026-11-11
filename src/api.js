import axios from 'axios'

const configuredApiUrl = import.meta.env.VITE_API_URL?.replace(/\/+$/, '')
const apiBaseUrl = configuredApiUrl
  ? /\/api$/i.test(configuredApiUrl)
    ? configuredApiUrl
    : `${configuredApiUrl}/api`
  : import.meta.env.DEV
    ? '/api'
    : 'https://stockflow-backend-kspj.onrender.com/api'

const api = axios.create({
  baseURL: apiBaseUrl,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('stockflow.token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export function getErrorMessage(error) {
  return error.response?.data?.error?.message || error.message || 'Something went wrong'
}

export default api
