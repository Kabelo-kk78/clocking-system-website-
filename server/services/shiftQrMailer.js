import { db } from './firebaseAdmin.js'
import { buildQrPayload } from './qrService.js'
import { resolveCurrentQr, getCompany } from './qrResolver.js'
import { sendDailyQREmail, renderQrDataUrl, getMailerMode } from './qrMailService.js'

export const wasShiftEmailed = async (date, shiftKey) => {
  const ref = db.collection('qrEmailLog').doc(`${date}_${shiftKey}`)
  const snap = await ref.get()
  return snap.exists ? snap.data() : null
}

const markShiftEmailed = async ({ date, shiftKey, sent, failed, mode }) => {
  await db.collection('qrEmailLog').doc(`${date}_${shiftKey}`).set({
    date,
    shift: shiftKey,
    sent,
    failed,
    mode,
    sentAt: new Date().toISOString()
  })
}

export const sendShiftQrEmails = async ({ date, shiftKey }) => {
  const mode = getMailerMode()

  const { qr, active } = await resolveCurrentQr({ generatedBy: 'system' })
  if (!qr || !active.shift || active.shift.key !== shiftKey) {
    return { skipped: true, reason: 'No shift window open for this QR code.' }
  }

  const qrData = qr.data()
  const employeesSnapshot = await db
    .collection('users')
    .where('role', '==', 'employee')
    .where('status', '==', 'active')
    .get()

  const employees = employeesSnapshot.docs
    .map((d) => d.data())
    .filter((e) => e.email)

  if (employees.length === 0) {
    return { skipped: true, reason: 'No active employees with an email address.', sent: 0, failed: 0, mode }
  }

  const company = await getCompany()
  const payload = qrData.payload || buildQrPayload({ token: qrData.token, date, company, shift: qrData.shift })
  const qrDataUrl = await renderQrDataUrl(payload)
  const companyName = company?.companyName || 'MDIHub'
  const shiftLabel = qrData.shiftLabel || (shiftKey === 'cob' ? 'Close of business' : 'Morning shift')
  const label = `${new Date(`${qrData.date}T00:00:00`).toLocaleDateString(undefined, {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  })} · ${shiftLabel}`

  let sent = 0
  const failures = []

  await Promise.all(employees.map(async (employee) => {
    try {
      await sendDailyQREmail({
        email: employee.email,
        name: `${employee.firstName || ''} ${employee.lastName || ''}`.trim(),
        date: qrData.date,
        label,
        token: qrData.token,
        qrDataUrl,
        expiresAt: qrData.expiresAt,
        companyName
      })
      sent += 1
    } catch (err) {
      failures.push({ email: employee.email, message: err.message })
    }
  }))

  await db.collection('attendanceLogs').add({
    employeeId: 'system',
    employeeName: 'qr-email-scheduler',
    action: 'EMAIL_DAILY_QR',
    result: failures.length ? 'PARTIAL' : 'APPROVED',
    reason: `Sent ${shiftLabel} QR to ${sent} employees${failures.length ? `, ${failures.length} failed` : ''} (${mode})`,
    timestamp: new Date().toISOString()
  })

  await markShiftEmailed({ date, shiftKey, sent, failed: failures.length, mode })

  return {
    sent,
    failed: failures.length,
    failures,
    date: qrData.date,
    shift: qrData.shift,
    shiftLabel,
    mode,
    message: mode === 'console'
      ? `${shiftLabel} QR recorded for ${sent} employee(s) — no email provider configured (first add SMTP or RESEND_API_KEY to server/.env).`
      : `${shiftLabel} QR emailed to ${sent} employee(s) via ${mode}.`
  }
}