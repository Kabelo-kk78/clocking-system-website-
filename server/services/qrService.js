import crypto from 'crypto'

export const generateSecureToken = () => {
  return crypto.randomBytes(32).toString('hex')
}

export const todayISO = (timezone = 'Africa/Johannesburg') => {
  const now = new Date()
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
  return formatter.format(now)
}

export const addMinutes = (date, minutes) => new Date(date.getTime() + minutes * 60000)

export const isExpired = (expiresAt) => {
  if (!expiresAt) return true
  const expiry = expiresAt.toDate ? expiresAt.toDate() : new Date(expiresAt)
  return expiry.getTime() < Date.now()
}

export const getCompanyLocation = async (db) => {
  const snapshot = await db.collection('companies').limit(1).get()
  if (snapshot.empty) return null
  const doc = snapshot.docs[0]
  return { id: doc.id, ...doc.data() }
}

export const buildQrPayload = ({ token, date, company, shift }) => {
  const payload = {
    v: 1,
    app: 'mdihub-clock',
    date,
    token,
    shift: shift || 'general',
    companyId: company?.id || 'default',
    company: company?.companyName || '',
    lat: company?.latitude != null ? Number(company.latitude) : null,
    lng: company?.longitude != null ? Number(company.longitude) : null,
    radius: Number(company?.radius) || 50
  }
  return JSON.stringify(payload)
}

export const parseQrValue = (value) => {
  if (!value) return null
  try {
    const parsed = JSON.parse(value)
    if (parsed && parsed.app === 'mdihub-clock' && parsed.token) return parsed
  } catch {
    return null
  }
  return null
}

export const extractQrToken = (value) => {
  const parsed = parseQrValue(value)
  return parsed ? parsed.token : value
}

const clockMinutes = (hhmm) => {
  const [h, m] = String(hhmm).split(':').map(Number)
  return (h || 0) * 60 + (m || 0)
}

export const getShiftConfig = () => {
  const morningStart = process.env.QR_MORNING_START || '08:00'
  const morningEnd = process.env.QR_MORNING_END || '08:15'
  const closeOfBusiness = process.env.SHIFT_CLOSE_OF_BUSINESS || '16:30'
  const cobStart = process.env.QR_COB_START || closeOfBusiness
  const cobEnd = process.env.QR_COB_END || '17:00'
  return {
    timezone: process.env.SHIFT_TIMEZONE || 'Africa/Johannesburg',
    closeOfBusiness,
    shifts: [
      {
        key: 'morning',
        label: 'Morning shift',
        startLabel: morningStart,
        endLabel: morningEnd,
        start: clockMinutes(morningStart),
        end: clockMinutes(morningEnd)
      },
      {
        key: 'cob',
        label: 'Close of business',
        startLabel: cobStart,
        endLabel: cobEnd,
        start: clockMinutes(cobStart),
        end: clockMinutes(cobEnd)
      }
    ]
  }
}

const zonedClock = (date, timezone) => {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23'
  }).formatToParts(date)
  const value = (t) => Number((parts.find((p) => p.type === t) || {}).value || 0)
  return { hour: value('hour'), minute: value('minute') }
}

const zonedOffset = (date, timezone) => {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    timeZoneName: 'longOffset'
  }).formatToParts(date)
  const name = (parts.find((p) => p.type === 'timeZoneName') || {}).value || 'GMT+02:00'
  return name.replace('GMT', '') || '+00:00'
}

export const getActiveShift = (now = new Date()) => {
  const config = getShiftConfig()
  const { hour, minute } = zonedClock(now, config.timezone)
  const current = hour * 60 + minute
  const shift = config.shifts.find((s) => current >= s.start && current < s.end) || null

  if (!shift) {
    return { shift: null, config, current }
  }

  const date = todayISO(config.timezone)
  const offset = zonedOffset(now, config.timezone)
  const expiresAt = new Date(`${date}T${shift.endLabel}:59${offset}`).toISOString()

  return {
    shift,
    config,
    current,
    date,
    expiresAt,
    windowStart: shift.startLabel,
    windowEnd: shift.endLabel,
    closeOfBusiness: config.closeOfBusiness
  }
}

export const nextShiftHint = (active) => {
  const config = active?.config || getShiftConfig()
  const current = active?.current
  const next = config.shifts.find((s) => s.start > (current ?? -1))
  const label = next || config.shifts[0]
  return `No shift window is open right now. The ${label?.label || 'morning'} QR auto-generates at ${label?.startLabel || '08:00'}.`
}