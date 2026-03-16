/**
 * Base API Service
 * Axios instance với interceptors
 */

import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 300000, // 5 minutes for long operations
  headers: {
    'Content-Type': 'application/json'
  }
})

// Response interceptor
api.interceptors.response.use(
  response => response.data,
  error => {
    console.error('API Error:', error)
    const message = error.response?.data?.error || error.message || 'Unknown error'
    throw new Error(message)
  }
)

export default api
