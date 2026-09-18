import { db } from '../services/firebaseAdmin.js'
import { todayISO } from '../services/qrService.js'

const parseDate = (value) => {
  const d = value ? new Date(`${value}T00:00:00`) : new Date()
  return isNaN(d.getTime()) ? new Date() : d
}

const isoOf = (date) => {
  const offset = date.getTimezoneOffset() * 60000
  return new Date(date.getTime() - offset).toISOString().split('T')[0]
}

const weekRange = (date) => {
  const d = parseDate(date)
  const day = (d.getDay() + 6) % 7
  const start = new Date(d)
  start.setDate(d.getDate() - day)
  const end = new Date(start)
  end.setDate(start.getDate() + 6)
  return { start: isoOf(start), end: isoOf(end) }
}

const monthRange = (date) => {
  const d = parseDate(date)
  const start = new Date(d.getFullYear(), d.getMonth(), 1)
  const end = new Date(d.getFullYear(), d.getMonth() + 1, 0)
  return { start: isoOf(start), end: isoOf(end) }
}

const fetchRange = async (start, end) => {
  const snapshot = await db
    .collection('attendance')
    .where('date', '>=', start)
    .where('date', '<=', end)
    .get()
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
}

const fetchEmployees = async () => {
  const snapshot = await db.collection('users').where('role', '==', 'employee').get()
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
}

const timeToMinutes = (value) => {
  if (!value) return null
  const d = new Date(value)
  if (isNaN(d.getTime())) return null
  return d.getHours() * 60 + d.getMinutes()
}

const minutesToTime = (minutes) => {
  if (minutes === null || minutes === undefined) return '-'
  const h = Math.floor(minutes / 60)
  const m = Math.round(minutes % 60)
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export const dailyReport = async (req, res) => {
  try {
    const date = req.query.date || todayISO()
    const [attendance, employees] = await Promise.all([fetchRange(date, date), fetchEmployees()])

    const present = attendance.filter((a) => a.clockIn && a.status !== 'REJECTED').length
    const late = attendance.filter((a) => a.status === 'LATE').length
    const clockedOut = attendance.filter((a) => a.clockOut).length
    const absent = Math.max(0, employees.length - present)

    const rows = attendance.map((a) => ({
      Employee: a.employeeName || a.employeeId,
      'Employee Number': a.employeeNumber || '',
      Department: a.department || '',
      Date: a.date,
      'Clock In': a.clockIn ? new Date(a.clockIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-',
      'Clock Out': a.clockOut ? new Date(a.clockOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-',
      Status: a.status || '',
      Distance: a.clockInDistance != null ? `${a.clockInDistance}m` : '-'
    }))

    return res.json({
      type: 'daily',
      range: { start: date, end: date },
      summary: { totalEmployees: employees.length, present, absent, late, clockedOut },
      rows
    })
  } catch (err) {
    console.error('[dailyReport]', err)
    return res.status(500).json({ message: 'Failed to generate daily report.' })
  }
}

export const weeklyReport = async (req, res) => {
  try {
    const { start, end } = weekRange(req.query.date)
    const [attendance, employees] = await Promise.all([fetchRange(start, end), fetchEmployees()])

    const rows = employees.map((emp) => {
      const records = attendance.filter((a) => a.employeeId === emp.id)
      const daysPresent = records.filter((a) => a.clockIn).length
      const lateDays = records.filter((a) => a.status === 'LATE').length

      const inTimes = records.map((a) => timeToMinutes(a.clockIn)).filter((t) => t !== null)
      const outTimes = records.map((a) => timeToMinutes(a.clockOut)).filter((t) => t !== null)

      const avg = (arr) => (arr.length ? arr.reduce((s, v) => s + v, 0) / arr.length : null)

      return {
        Employee: `${emp.firstName} ${emp.lastName}`,
        'Employee Number': emp.employeeNumber || '',
        'Days Present': daysPresent,
        'Late Days': lateDays,
        'Average Clock-In': minutesToTime(avg(inTimes)),
        'Average Clock-Out': minutesToTime(avg(outTimes))
      }
    })

    return res.json({
      type: 'weekly',
      range: { start, end },
      summary: {
        totalEmployees: employees.length,
        present: rows.reduce((s, r) => s + r['Days Present'], 0),
        absent: 0,
        late: rows.reduce((s, r) => s + r['Late Days'], 0)
      },
      rows
    })
  } catch (err) {
    console.error('[weeklyReport]', err)
    return res.status(500).json({ message: 'Failed to generate weekly report.' })
  }
}

export const monthlyReport = async (req, res) => {
  try {
    const { start, end } = monthRange(req.query.date)
    const [attendance, employees] = await Promise.all([fetchRange(start, end), fetchEmployees()])

    const startD = parseDate(start)
    const endD = parseDate(end)

    let workingDays = 0
    for (let d = new Date(startD); d <= endD; d.setDate(d.getDate() + 1)) {
      const day = d.getDay()
      if (day !== 0 && day !== 6) workingDays++
    }

    const rows = employees.map((emp) => {
      const records = attendance.filter((a) => a.employeeId === emp.id)
      const present = records.filter((a) => a.clockIn).length
      const late = records.filter((a) => a.status === 'LATE').length
      const absent = Math.max(0, workingDays - present)
      const percentage = workingDays ? ((present / workingDays) * 100).toFixed(1) : '0.0'

      return {
        Employee: `${emp.firstName} ${emp.lastName}`,
        'Employee Number': emp.employeeNumber || '',
        'Working Days': workingDays,
        Present: present,
        Absent: absent,
        Late: late,
        'Attendance %': `${percentage}%`
      }
    })

    return res.json({
      type: 'monthly',
      range: { start, end },
      summary: { totalEmployees: employees.length, present: rows.reduce((s, r) => s + r.Present, 0), absent: rows.reduce((s, r) => s + r.Absent, 0), late: rows.reduce((s, r) => s + r.Late, 0) },
      rows
    })
  } catch (err) {
    console.error('[monthlyReport]', err)
    return res.status(500).json({ message: 'Failed to generate monthly report.' })
  }
}