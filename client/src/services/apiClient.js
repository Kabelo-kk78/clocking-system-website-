import { auth } from './firebase'

export const apiFetch = async (url, options = {}) => {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) }

  const currentUser = auth.currentUser
  if (currentUser) {
    const idToken = await currentUser.getIdToken()
    headers.Authorization = `Bearer ${idToken}`
  }

  const res = await fetch(url, { ...options, headers })
  let data = {}
  try {
    data = await res.json()
  } catch {
    data = {}
  }

  if (!res.ok) {
    const error = new Error(data.message || `Request failed (${res.status})`)
    error.status = res.status
    error.data = data
    throw error
  }

  return data
}

export default apiFetch