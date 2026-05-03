import axios from 'axios'
import { getAuthToken } from './authToken'
import { notifyAuthUnauthorized } from './authEvents'

const DEFAULT_DEV_API_ORIGIN = 'http://localhost:5000'

/**
 * Axios base URL for the backend `/api` routes.
 * - Prefer `VITE_API_URL` (e.g. https://app.onrender.com or http://localhost:5001).
 * - Falls back to `VITE_API_BASE_URL` for older `.env` files.
 * - If neither is set, defaults to `http://localhost:5000` + `/api`.
 */
function resolveApiBaseUrl() {
  const viteApiUrl =
    typeof import.meta.env.VITE_API_URL === 'string'
      ? import.meta.env.VITE_API_URL.trim()
      : ''
  const legacyBase =
    typeof import.meta.env.VITE_API_BASE_URL === 'string'
      ? import.meta.env.VITE_API_BASE_URL.trim()
      : ''

  const raw = viteApiUrl || legacyBase
  if (!raw) {
    return `${DEFAULT_DEV_API_ORIGIN.replace(/\/+$/, '')}/api`
  }

  const trimmed = raw.replace(/\/+$/, '')
  if (trimmed.endsWith('/api')) return trimmed
  return `${trimmed}/api`
}

export const API_BASE_URL = resolveApiBaseUrl()

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use(async (config) => {
  const token = await getAuthToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Response interceptor for unified error handling
api.interceptors.response.use(
  (res) => res.data,
  (err) => {
    const status = err.response?.status
    if (status === 401) {
      notifyAuthUnauthorized()
    }
    const message =
      err.response?.data?.message ||
      err.message ||
      'Something went wrong'
    return Promise.reject(new Error(message))
  }
)

// Expense API
export const expenseAPI = {
  getAll: (params) => api.get('/expenses', { params }),
  getById: (id) => api.get(`/expenses/${id}`),
  create: (data) => api.post('/expenses', data),
  update: (id, data) => api.put(`/expenses/${id}`, data),
  delete: (id) => api.delete(`/expenses/${id}`),
  getDashboard: () => api.get('/expenses/dashboard'),
  getCategories: () => api.get('/expenses/categories'),
}

// Insights API
export const insightAPI = {
  generate: async (months = 3) => {
    try {
      const res = await api.post('/insights', {}, { params: { months } })
      if (!res || typeof res !== 'object') {
        throw new Error('Invalid insights response')
      }
      return res
    } catch (err) {
      if (err?.message?.includes('not valid JSON')) {
        throw new Error('Insights service returned invalid data')
      }
      throw err
    }
  },
}

export default api
