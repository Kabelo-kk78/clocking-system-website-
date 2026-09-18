import { db } from '../services/firebaseAdmin.js'
import { haversineDistance, isValidCoordinate } from '../services/distanceService.js'
import { todayISO } from '../services/qrService.js'
import {
  sendClockInEmail,
  sendClockOutEmail,
  sendAdminClockNotification,
  getMailMode
} from '../services/mailer.js'

const MAX_ACCURACY = parseInt(process.env.MAX_GPS_ACCURACY_METRES || '50', 10)

const getAdminRecipients = async () => {
  const override = process.env.ADMIN_NOTIFY_EMAIL
  if (override) return override.split(',').map((e) => e.trim()).filter(Boolean)
  const snapshot = await db.collection('users').where('role', '==', 'admin').where('status', '==', 'active').get()
  return snapshot.docs.map((d) => d.data().email).filter(Boolean)
}

const notifyClockEvent = async ({ action, user, company, distance, duration }) => {
  const employeeName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email
  const now = new Date()
  const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  const date = todayISO()
  const companyName = company?.companyName || 'MDIHub'
  const results = []

  try {
    if (user.email) {
      const result = action === 'CLOCK_IN'
        ? await sendClockInEmail({ email: user.email, name: employeeName.split(' ')[0] || 'there', companyName, date, time, distance })
        : await sendClockOutEmail({ email: user.email, name: employeeName.split(' ')[0] || 'there', companyName, date, time, distance, duration })
      results.push({ to: user.email, mode: result.mode })
    }
  } catch (err) {
    results.push({ to: user.email, error: err.message })
  }

  const admins = await getAdminRecipients()
  await Promise.all(admins.map(async (adminEmail) => {
    try {
      const result = await sendAdminClockNotification({ email: adminEmail, employeeName, companyName, action, date, time, distance })
      results.push({ to: adminEmail, mode: result.mode })
    } catch (err) {
      results.push({ to: adminEmail, error: err.message })
    }
  }))

  try {
    const failedEmails = results.some((r) => r.error)
    if (results.length) {
      await db.collection('attendanceLogs').add({
        employeeId: user.uid,
        employeeName,
        action: `EMAIL_${action}`,
        result: failedEmails ? 'PARTIAL' : 'APPROVED',
        reason: `${results.length} email(s) (${getMailMode()})`,
        timestamp: new Date().toISOString()
      })
    }
  } catch (err) {
    console.error('[notifyClockEvent log]', err.message)
  }
}

const recordLog = async (data) => {
  try {
    await db.collection('attendanceLogs').add({
      ...data,
      timestamp: new Date().toISOString()
    })
  } catch (err) {
    console.error('[attendanceLog]', err.message)
  }
}

const getCompany = async () => {
  const snapshot = await db.collection('companies').limit(1).get()
  if (snapshot.empty) return null
  const doc = snapshot.docs[0]
  return { id: doc.id, ...doc.data() }
}

const getValidToken = async (token, date, expectedShift) => {
  if (!token) return { error: 'No QR token supplied. Scan today\'s QR code to continue.' }

  const snapshot = await db
    .collection('dailyQrCodes')
    .where('token', '==', token)
    .limit(1)
    .get()

  if (snapshot.empty) return { error: 'Invalid QR code. This token is not recognised.' }

  const doc = snapshot.docs[0]
  const qr = doc.data()

  if (!qr.active) return { error: 'This QR code has been revoked.' }
  if (qr.date !== date) return { error: 'This QR code is not valid for today.' }

  const expiry = new Date(qr.expiresAt)
  if (expiry.getTime() < Date.now()) {
    await db.collection('dailyQrCodes').doc(doc.id).update({ active: false })
    return { error: 'This QR code has expired.' }
  }

  if (expectedShift && qr.shift !== expectedShift) {
    const expectedLabel = expectedShift === 'cob' ? 'close-of-business' : 'morning'
    return { error: `This QR code is not for that action. Scan the ${expectedLabel} QR code instead.` }
  }

  return { qr, qrId: doc.id }
}

const validateLocation = (company, location, action, employeeName) => {
  if (!location || !isValidCoordinate(location.latitude, location.longitude)) {
    return { ok: false, reason: 'A valid GPS location is required to clock in/out.' }
  }

  const accuracy = Number(location.accuracy)
  if (Number.isFinite(accuracy) && accuracy > MAX_ACCURACY) {
    return {
      ok: false,
      reason: `GPS accuracy is too low (±${Math.round(accuracy)}m). Move to an open area and try again.`
    }
  }

  const radius = Number(company.radius) || 50
  const distance = haversineDistance(
    company.latitude,
    company.longitude,
    location.latitude,
    location.longitude
  )

  if (distance > radius) {
    return {
      ok: false,
      distance,
      reason: `You are ${Math.round(distance)}m from company premises. You must be within ${radius}m.`
    }
  }

  return { ok: true, distance }
}

export const clockInHandler = async (req, res) => {
  const { token, location } = req.body || {}
  const date = todayISO()
  const employeeName = `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim() || req.user.email

  try {
    const company = await getCompany()
    if (!company) {
      return res.status(400).json({ message: 'Company location is not configured. Contact your administrator.' })
    }

    const tokenCheck = await getValidToken(token, date, 'morning')
    if (tokenCheck.error) {
      await recordLog({
        employeeId: req.user.uid,
        employeeName,
        action: 'CLOCK_IN',
        latitude: location?.latitude,
        longitude: location?.longitude,
        result: 'REJECTED',
        reason: tokenCheck.error
      })
      return res.status(400).json({ message: tokenCheck.error })
    }

    const locationCheck = validateLocation(company, location, 'CLOCK_IN', employeeName)
    if (!locationCheck.ok) {
      await recordLog({
        employeeId: req.user.uid,
        employeeName,
        action: 'CLOCK_IN',
        latitude: location?.latitude,
        longitude: location?.longitude,
        distance: locationCheck.distance,
        accuracy: location?.accuracy,
        result: 'REJECTED',
        reason: locationCheck.reason
      })
      return res.status(400).json({ message: locationCheck.reason })
    }

    const existing = await db
      .collection('attendance')
      .where('employeeId', '==', req.user.uid)
      .where('date', '==', date)
      .limit(1)
      .get()

    if (!existing.empty) {
      const record = existing.docs[0].data()
      if (record.clockIn) {
        const msg = 'You have already clocked in today.'
        await recordLog({
          employeeId: req.user.uid,
          employeeName,
          action: 'CLOCK_IN',
          distance: locationCheck.distance,
          result: 'REJECTED',
          reason: msg
        })
        return res.status(409).json({ message: msg })
      }
    }

    const now = new Date()
    const record = {
      employeeId: req.user.uid,
      employeeName,
      employeeNumber: req.user.employeeNumber || '',
      department: req.user.department || '',
      companyId: company.id,
      date,
      clockIn: now.toISOString(),
      clockInLatitude: Number(location.latitude),
      clockInLongitude: Number(location.longitude),
      clockInAccuracy: Number(location.accuracy) || null,
      clockInDistance: Math.round(locationCheck.distance),
      clockOut: null,
      clockOutLatitude: null,
      clockOutLongitude: null,
      clockOutAccuracy: null,
      clockOutDistance: null,
      status: 'CLOCKED_IN',
      qrId: tokenCheck.qrId,
      createdAt: now.toISOString()
    }

    let attendanceId
    if (!existing.empty) {
      attendanceId = existing.docs[0].id
      await db.collection('attendance').doc(attendanceId).set(record, { merge: true })
    } else {
      const ref = await db.collection('attendance').add(record)
      attendanceId = ref.id
    }

    await recordLog({
      employeeId: req.user.uid,
      employeeName,
      action: 'CLOCK_IN',
      latitude: Number(location.latitude),
      longitude: Number(location.longitude),
      distance: Math.round(locationCheck.distance),
      accuracy: Number(location.accuracy) || null,
      result: 'APPROVED',
      reason: 'Within geofence and valid QR.'
    })

    await notifyClockEvent({
      action: 'CLOCK_IN',
      user: req.user,
      company,
      distance: Math.round(locationCheck.distance)
    })

    return res.json({
      success: true,
      attendanceId,
      clockIn: record.clockIn,
      distance: Math.round(locationCheck.distance),
      status: 'CLOCKED_IN',
      message: 'Clocked in successfully.'
    })
  } catch (err) {
    console.error('[clockIn]', err)
    return res.status(500).json({ message: 'Failed to clock in. Please try again.' })
  }
}

export const clockOutHandler = async (req, res) => {
  const { token, location } = req.body || {}
  const date = todayISO()
  const employeeName = `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim() || req.user.email

  try {
    const company = await getCompany()
    if (!company) {
      return res.status(400).json({ message: 'Company location is not configured.' })
    }

    const tokenCheck = await getValidToken(token, date, 'cob')
    if (tokenCheck.error) {
      await recordLog({
        employeeId: req.user.uid,
        employeeName,
        action: 'CLOCK_OUT',
        latitude: location?.latitude,
        longitude: location?.longitude,
        result: 'REJECTED',
        reason: tokenCheck.error
      })
      return res.status(400).json({ message: tokenCheck.error })
    }

    const locationCheck = validateLocation(company, location, 'CLOCK_OUT', employeeName)
    if (!locationCheck.ok) {
      await recordLog({
        employeeId: req.user.uid,
        employeeName,
        action: 'CLOCK_OUT',
        latitude: location?.latitude,
        longitude: location?.longitude,
        distance: locationCheck.distance,
        result: 'REJECTED',
        reason: locationCheck.reason
      })
      return res.status(400).json({ message: locationCheck.reason })
    }

    const existing = await db
      .collection('attendance')
      .where('employeeId', '==', req.user.uid)
      .where('date', '==', date)
      .limit(1)
      .get()

    if (existing.empty || !existing.docs[0].data().clockIn) {
      const msg = 'You must clock in before you can clock out.'
      await recordLog({ employeeId: req.user.uid, employeeName, action: 'CLOCK_OUT', result: 'REJECTED', reason: msg })
      return res.status(400).json({ message: msg })
    }

    const doc = existing.docs[0]
    const record = doc.data()

    if (record.clockOut) {
      const msg = 'You have already clocked out today.'
      await recordLog({ employeeId: req.user.uid, employeeName, action: 'CLOCK_OUT', result: 'REJECTED', reason: msg })
      return res.status(409).json({ message: msg })
    }

    const now = new Date()
    const clockIn = new Date(record.clockIn)
    const durationMs = now.getTime() - clockIn.getTime()
    const hours = Math.floor(durationMs / 3600000)
    const minutes = Math.floor((durationMs % 3600000) / 60000)
    const duration = `${hours}h ${minutes}m`

    await db.collection('attendance').doc(doc.id).update({
      clockOut: now.toISOString(),
      clockOutLatitude: Number(location.latitude),
      clockOutLongitude: Number(location.longitude),
      clockOutAccuracy: Number(location.accuracy) || null,
      clockOutDistance: Math.round(locationCheck.distance),
      clockOutQrId: tokenCheck.qrId,
      status: 'CLOCKED_OUT',
      duration,
      updatedAt: now.toISOString()
    })

    await recordLog({
      employeeId: req.user.uid,
      employeeName,
      action: 'CLOCK_OUT',
      latitude: Number(location.latitude),
      longitude: Number(location.longitude),
      distance: Math.round(locationCheck.distance),
      accuracy: Number(location.accuracy) || null,
      result: 'APPROVED',
      reason: `Duration ${duration}`
    })

    await notifyClockEvent({
      action: 'CLOCK_OUT',
      user: req.user,
      company,
      distance: Math.round(locationCheck.distance),
      duration
    })

    return res.json({
      success: true,
      clockOut: now.toISOString(),
      duration,
      distance: Math.round(locationCheck.distance),
      status: 'CLOCKED_OUT',
      message: 'Clocked out successfully.'
    })
  } catch (err) {
    console.error('[clockOut]', err)
    return res.status(500).json({ message: 'Failed to clock out. Please try again.' })
  }
}

export const getMyAttendance = async (req, res) => {
  try {
    const snapshot = await db
      .collection('attendance')
      .where('employeeId', '==', req.user.uid)
      .get()

    const records = snapshot.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .sort((a, b) => (b.date || '').localeCompare(a.date || ''))

    return res.json({ records })
  } catch (err) {
    console.error('[myAttendance]', err)
    return res.status(500).json({ message: 'Failed to load attendance history.' })
  }
}