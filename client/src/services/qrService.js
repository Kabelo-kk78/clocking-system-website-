import apiFetch from './apiClient'

export const generateDailyQR = async () => {
  return apiFetch('/api/qr/generate', { method: 'POST' })
}

export const getTodayToken = async () => {
  return apiFetch('/api/qr/today')
}

export const validateTokenOnServer = async (token, location) => {
  return apiFetch('/api/qr/validate', {
    method: 'POST',
    body: JSON.stringify({ token, location })
  })
}

export const revokeDailyQR = async () => {
  return apiFetch('/api/qr/revoke', { method: 'POST' })
}

export const emailDailyQR = async () => {
  return apiFetch('/api/qr/email', { method: 'POST' })
}