import axios from 'axios'

const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

const client = axios.create({ baseURL })

// Set by AuthContext once it mounts, so the interceptor can read the current
// token without importing the context (which would create a cycle) and
// clear auth state on a 401 without React ever being in the call stack.
let getToken = () => null
let onUnauthorized = () => {}

export function registerAuthHooks({ getToken: getTokenFn, onUnauthorized: onUnauthorizedFn }) {
  getToken = getTokenFn
  onUnauthorized = onUnauthorizedFn
}

client.interceptors.request.use((config) => {
  const token = getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      onUnauthorized()
    }
    return Promise.reject(error)
  }
)

export default client
