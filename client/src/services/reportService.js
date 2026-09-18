import apiFetch from './apiClient'

export const generateDailyReport = async (date) => {
  return apiFetch(`/api/reports/daily?date=${date}`)
}

export const generateWeeklyReport = async (date) => {
  return apiFetch(`/api/reports/weekly?date=${date}`)
}

export const generateMonthlyReport = async (date) => {
  return apiFetch(`/api/reports/monthly?date=${date}`)
}

const toCSV = (rows) => {
  if (!rows || rows.length === 0) return ''
  const headers = Object.keys(rows[0])
  const escape = (value) => {
    const str = value === null || value === undefined ? '' : String(value)
    return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str
  }
  return [headers.join(','), ...rows.map((row) => headers.map((h) => escape(row[h])).join(','))].join('\n')
}

const downloadBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export const exportCSV = (rows, filename) => {
  const csv = toCSV(rows)
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  downloadBlob(blob, filename)
}