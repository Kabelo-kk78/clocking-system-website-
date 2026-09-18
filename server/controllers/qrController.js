import { db } from '../services/firebaseAdmin.js'
import {
  todayISO,
  isExpired,
  extractQrToken,
  getActiveShift,
  nextShiftHint
} from '../services/qrService.js'
import {
  getCompany,
  createShiftQr,
  fetchActiveShiftQr,
  resolveCurrentQr
} from '../services/qrResolver.js'
import { sendShiftQrEmails } from '../services/shiftQrMailer.js'

export const generateDailyQR = async (req, res) => {
  try {
    const active = getActiveShift()
    if (!active.shift) {
      return res.status(400).json({ message: nextShiftHint(active) })
    }

    const existing = await fetchActiveShiftQr({ date: active.date, shiftKey: active.shift.key })
    if (existing) {
      await existing.ref.update({ active: false })
    }

    const now = new Date()
    const doc = await createShiftQr({
      shiftKey: active.shift.key,
      shiftLabel: active.shift.label,
      date: active.date,
      now,
      expiresAtISO: active.expiresAt,
      windowStart: active.windowStart,
      windowEnd: active.windowEnd,
      generatedBy: req.user?.uid || 'admin'
    })

    return res.json({
      id: doc.qr.id,
      token: doc.token,
      payload: doc.payload,
      date: active.date,
      shift: active.shift.key,
      shiftLabel: active.shift.label,
      windowStart: active.windowStart,
      windowEnd: active.windowEnd,
      closeOfBusiness: active.config.closeOfBusiness,
      createdAt: now.toISOString(),
      expiresAt: active.expiresAt,
      active: true
    })
  } catch (err) {
    console.error('[QR generate]', err)
    return res.status(500).json({ message: 'Failed to generate the shift QR code.' })
  }
}

export const getTodayQR = async (req, res) => {
  try {
    const { qr, active } = await resolveCurrentQr({ generatedBy: req.user?.uid || 'system' })

    if (!qr) {
      return res.status(404).json({ message: nextShiftHint(active), shift: null })
    }

    const data = qr.data()
    const expiry = data.expiresAt
    if (isExpired(expiry)) {
      await qr.ref.update({ active: false })
      const next = await resolveCurrentQr({ generatedBy: req.user?.uid || 'system' })
      if (!next.qr) {
        return res.status(404).json({ message: nextShiftHint(next.active), shift: null })
      }
      return res.json({ id: next.qr.id, ...next.qr.data(), closeOfBusiness: next.active.config.closeOfBusiness })
    }

    return res.json({ id: qr.id, ...data, closeOfBusiness: active.config.closeOfBusiness })
  } catch (err) {
    console.error('[QR today]', err)
    return res.status(500).json({ message: 'Failed to load today\'s QR code.' })
  }
}

export const validateQRToken = async (req, res) => {
  try {
    const { token: rawToken, location, payload } = req.body || {}
    const token = payload ? extractQrToken(payload) : rawToken

    if (!token) {
      return res.status(400).json({ message: 'QR token is required.', valid: false })
    }

    const date = todayISO()
    const snapshot = await db
      .collection('dailyQrCodes')
      .where('token', '==', token)
      .limit(1)
      .get()

    if (snapshot.empty) {
      return res.status(400).json({ valid: false, message: 'Invalid QR code. This token is not recognised.' })
    }

    const doc = snapshot.docs[0]
    const qr = doc.data()

    if (!qr.active) {
      return res.status(400).json({ valid: false, message: 'This QR code has been revoked.' })
    }

    if (qr.date !== date) {
      return res.status(400).json({ valid: false, message: 'This QR code is not for today. Only today\'s code is valid.' })
    }

    const expiry = qr.expiresAt
    if (!isExpired(expiry)) {
      const active = getActiveShift()
      if (qr.shift && qr.shift !== 'general' && active.shift && qr.shift !== active.shift.key) {
        return res.status(400).json({ valid: false, message: 'This QR code belongs to the previous shift. Scan the current shift\'s QR code.' })
      }
      if (qr.shift && qr.shift !== 'general' && !active.shift) {
        return res.status(400).json({ valid: false, message: 'No shift window is open right now.' })
      }
    } else {
      await db.collection('dailyQrCodes').doc(doc.id).update({ active: false })
      return res.status(400).json({ valid: false, message: 'This QR code has expired.' })
    }

    const company = await getCompany()
    const verified = company && location && typeof location.latitude === 'number' && typeof location.longitude === 'number'
      ? haversine(company.latitude, company.longitude, location.latitude, location.longitude)
      : null

    return res.json({
      valid: true,
      message: 'QR code is valid.',
      qrId: doc.id,
      payload: qr.payload || null,
      company,
      verifiedDistance: verified
    })
  } catch (err) {
    console.error('[QR validate]', err)
    return res.status(500).json({ valid: false, message: 'Failed to validate QR code.' })
  }
}

const haversine = (lat1, lon1, lat2, lon2) => {
  const toRad = (deg) => (deg * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
  return 6371000 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export const revokeTodayQR = async (req, res) => {
  try {
    const date = todayISO()
    const snapshot = await db
      .collection('dailyQrCodes')
      .where('date', '==', date)
      .where('active', '==', true)
      .get()

    if (snapshot.empty) {
      return res.status(404).json({ message: 'No active QR code to revoke.' })
    }

    const batch = db.batch()
    snapshot.docs.forEach((doc) => {
      batch.update(doc.ref, { active: false })
    })
    await batch.commit()

    return res.json({ success: true, message: 'Daily QR code revoked.' })
  } catch (err) {
    console.error('[QR revoke]', err)
    return res.status(500).json({ message: 'Failed to revoke QR code.' })
  }
}

export const emailTodayQR = async (req, res) => {
  try {
    const active = getActiveShift()
    if (!active.shift) {
      return res.status(404).json({ message: nextShiftHint(active) })
    }

    const result = await sendShiftQrEmails({ date: active.date, shiftKey: active.shift.key })
    if (result.skipped) {
      return res.status(404).json({ message: result.reason || 'No QR code available to email.' })
    }

    return res.json(result)
  } catch (err) {
    console.error('[QR email]', err)
    return res.status(500).json({ message: 'Failed to email the shift QR code.' })
  }
}