export const todayISO = () => {
  const now = new Date()
  const offset = now.getTimezoneOffset() * 60000
  return new Date(now.getTime() - offset).toISOString().split('T')[0]
}

export const formatDateNice = (isoDate) => {
  if (!isoDate) return '-'
  try {
    return new Date(`${isoDate}T00:00:00`).toLocaleDateString(undefined, {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  } catch {
    return isoDate
  }
}

export const formatTime = (value) => {
  if (!value) return '-'
  const date = value instanceof Date ? value : new Date(value)
  if (isNaN(date.getTime())) return value
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export const formatDateTime = (value) => {
  if (!value) return '-'
  const date = value instanceof Date ? value : new Date(value)
  if (isNaN(date.getTime())) return value
  return date.toLocaleString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export const greeting = () => {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

export const getWeekRange = (date = new Date()) => {
  const d = new Date(date)
  const day = (d.getDay() + 6) % 7
  const start = new Date(d)
  start.setDate(d.getDate() - day)
  const end = new Date(start)
  end.setDate(start.getDate() + 6)
  return { start: isoDate(start), end: isoDate(end) }
}

export const getMonthRange = (date = new Date()) => {
  const start = new Date(date.getFullYear(), date.getMonth(), 1)
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0)
  return { start: isoDate(start), end: isoDate(end) }
}

const isoDate = (date) => {
  const offset = date.getTimezoneOffset() * 60000
  return new Date(date.getTime() - offset).toISOString().split('T')[0]
}