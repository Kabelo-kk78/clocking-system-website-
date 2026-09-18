import crypto from 'crypto'
import { Resend } from 'resend'
import nodemailer from 'nodemailer'
import { db, configured } from './firebaseAdmin.js'

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

const dkimOptions = () => {
  const domainName = process.env.DKIM_DOMAIN_NAME
  const keySelector = process.env.DKIM_SELECTOR
  const privateKey = process.env.DKIM_PRIVATE_KEY
  if (!domainName || !keySelector || !privateKey) return undefined
  return {
    domainName,
    keySelector,
    privateKey: privateKey.replace(/\\n/g, '\n')
  }
}

let transporter = null
if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
  const port = parseInt(process.env.SMTP_PORT || '587', 10)
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465,
    requireTLS: port === 587,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    },
    dkim: dkimOptions()
  })
}

export const getMailMode = () => (resend ? 'resend' : transporter ? 'smtp' : 'console')

export const getFromAddress = () =>
  process.env.RESEND_FROM || process.env.SMTP_FROM || 'MDIHub Clocking <no-reply@mdihub.co.za>'

export const isMailerConfigured = () => true

const makeMessageId = () => `<${crypto.randomUUID()}@mdihub-clocking>`

const persistEmail = async (payload) => {
  try {
    if (db && configured) {
      await db.collection('emailsSent').add({
        ...payload,
        mode: 'console',
        messageId: payload.messageId,
        delivered: false,
        simulated: true,
        timestamp: new Date().toISOString()
      })
    }
  } catch (err) {
    console.error('[mailer:persist]', err.message)
  }
}

export const sendMail = async ({ to, subject, text, html, replyTo }) => {
  const from = getFromAddress()
  const messageId = makeMessageId()
  const envelope = {
    from,
    to,
    subject,
    text,
    html,
    replyTo: replyTo || from,
    messageId,
    headers: {
      'X-Mailer': 'MDIHub Clocking',
      'X-Auto-Response-Suppress': 'OOF'
    }
  }

  if (resend) {
    const { data, error } = await resend.emails.send(envelope)
    if (error) {
      throw new Error(error.message || 'Email delivery failed.')
    }
    return { delivered: true, mode: 'resend', messageId: data?.id || messageId }
  }

  if (transporter) {
    try {
      const info = await transporter.sendMail(envelope)
      return { delivered: true, mode: 'smtp', messageId: info?.messageId || messageId }
    } catch (err) {
      console.error(`[mailer:smtp] SMTP delivery failed — falling back to console logger (${err.message})`)
    }
  }

  console.log(`[mailer:console] To=${to} Subject="${subject}"`)
  await persistEmail(envelope)
  return { delivered: false, mode: 'console', messageId }
}

export const sendDailyQREmail = async ({ email, name, date, label, token, qrDataUrl, expiresAt, companyName }) => {
  const text = [
    `Your daily attendance QR code — ${label}`,
    '',
    'Scan the QR code included in this email using the MDIHub app to clock in',
    'and scan it again to clock out.',
    '',
    `This code is valid only for ${date} and expires at the end of the day.`,
    '',
    'To clock in:',
    '1. Open the MDIHub app and sign in.',
    '2. Allow location access. You must be within the geofence of the office.',
    '3. Scan the QR code to record your attendance.',
    '',
    'If the QR code in the email does not display, copy this token into the app:',
    token,
    '',
    'If you have any problems, contact the administrator.'
  ].join('\n')

  const html = [
    '<div style="font-family:Arial,Helvetica,sans-serif;max-width:520px;margin:0 auto;color:#1f2937">',
    `  <h2 style="margin:0 0 4px">${companyName || 'MDIHub'} Clocking System</h2>`,
    `  <p style="color:#6b7280;margin:0 0 20px">Your daily QR code — ${label}</p>`,
    '  <div style="text-align:center;background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;padding:24px">',
    `    <img src="${qrDataUrl}" alt="Daily attendance QR code" width="280" height="280" style="display:block;margin:0 auto;border-radius:8px" />`,
    '    <p style="margin:16px 0 4px;font-size:14px;color:#374151">Scan to clock in. Scan again to clock out.</p>',
    `    <p style="margin:0;font-size:12px;color:#9ca3af">This code is valid only for ${date}.</p>`,
    '  </div>',
    '  <div style="margin:20px 0;background:#eff6ff;border-radius:8px;padding:12px 16px;font-size:13px;color:#1d4ed8">',
    '    <strong>How it works</strong>',
    '    <ol style="margin:6px 0 0;padding-left:20px;color:#1e40af">',
    '      <li>Open the MDIHub app and sign in.</li>',
    '      <li>Allow location access — you must be within the office geofence.</li>',
    '      <li>Scan this QR code to record your attendance.</li>',
    '    </ol>',
    '  </div>',
    '  <p style="font-size:12px;color:#9ca3af;margin-top:20px">If you have any problems, contact the administrator.</p>',
    '</div>'
  ].join('\n')

  return sendMail({ to: email, subject: `Your ${label} attendance QR code`, text, html })
}

export const sendClockInEmail = async ({ email, name, companyName, date, time, distance }) => {
  const subject = `You are clocked in — ${time}`
  const text = [
    `Hi ${name},`,
    '',
    `You clocked in at ${time} on ${date}.`,
    distance != null ? `Distance from the office: ${Math.round(distance)}m.` : '',
    '',
    'Thank you.',
    `${companyName || 'MDIHub'} Clocking System`
  ].filter(Boolean).join('\n')

  const html = [
    '<div style="font-family:Arial,Helvetica,sans-serif;max-width:520px;margin:0 auto;color:#1f2937">',
    `  <h2 style="margin:0 0 4px">${companyName || 'MDIHub'} Clocking System</h2>`,
    '  <div style="margin:16px 0;background:#ecfdf5;border:1px solid #d1fae5;border-radius:12px;padding:20px">',
    '    <p style="margin:0 0 8px;font-size:14px;color:#047857">You are clocked in.</p>',
    `    <p style="margin:0;font-size:20px;font-weight:bold;color:#065f46">${time}</p>`,
    `    <p style="margin:8px 0 0;font-size:12px;color:#6b7280">${date}</p>`,
    distance != null ? `    <p style="margin:4px 0 0;font-size:12px;color:#6b7280">Distance from the office: ${Math.round(distance)}m</p>` : '',
    '  </div>',
    '  <p style="font-size:12px;color:#9ca3af">Scan the daily QR code again when you leave to clock out.</p>',
    '</div>'
  ].filter(Boolean).join('\n')

  return sendMail({ to: email, subject, text, html })
}

export const sendClockOutEmail = async ({ email, name, companyName, date, time, distance, duration }) => {
  const subject = `You are clocked out — ${time}`
  const text = [
    `Hi ${name},`,
    '',
    `You clocked out at ${time} on ${date}.`,
    duration ? `Total time: ${duration}.` : '',
    distance != null ? `Distance from the office: ${Math.round(distance)}m.` : '',
    '',
    'Thank you.',
    `${companyName || 'MDIHub'} Clocking System`
  ].filter(Boolean).join('\n')

  const html = [
    '<div style="font-family:Arial,Helvetica,sans-serif;max-width:520px;margin:0 auto;color:#1f2937">',
    `  <h2 style="margin:0 0 4px">${companyName || 'MDIHub'} Clocking System</h2>`,
    '  <div style="margin:16px 0;background:#eff6ff;border:1px solid #dbeafe;border-radius:12px;padding:20px">',
    '    <p style="margin:0 0 8px;font-size:14px;color:#1d4ed8">You are clocked out.</p>',
    `    <p style="margin:0;font-size:20px;font-weight:bold;color:#1e3a8a">${time}</p>`,
    `    <p style="margin:8px 0 0;font-size:12px;color:#6b7280">${date}</p>`,
    duration ? `    <p style="margin:4px 0 0;font-size:12px;color:#6b7280">Total time: ${duration}</p>` : '',
    distance != null ? `    <p style="margin:4px 0 0;font-size:12px;color:#6b7280">Distance from the office: ${Math.round(distance)}m</p>` : '',
    '  </div>',
    '  <p style="font-size:12px;color:#9ca3af">Have a good rest of your day.</p>',
    '</div>'
  ].filter(Boolean).join('\n')

  return sendMail({ to: email, subject, text, html })
}

export const sendAdminClockNotification = async ({ email, employeeName, companyName, action, date, time, distance }) => {
  const kind = action === 'CLOCK_IN' ? 'clocked in' : 'clocked out'
  const subject = `${employeeName} ${kind} — ${time}`
  const text = [
    `${employeeName} ${kind} at ${time} on ${date}.`,
    distance != null ? `Distance from the office: ${Math.round(distance)}m.` : '',
    '',
    `${companyName || 'MDIHub'} Clocking System`
  ].filter(Boolean).join('\n')

  const html = [
    '<div style="font-family:Arial,Helvetica,sans-serif;max-width:520px;margin:0 auto;color:#1f2937">',
    `  <h2 style="margin:0 0 4px">${companyName || 'MDIHub'} Clocking System</h2>`,
    `  <div style="margin:16px 0;background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;padding:20px">`,
    `    <p style="margin:0;font-size:15px;color:#374151"><strong>${employeeName}</strong> ${kind} at <strong>${time}</strong></p>`,
    `    <p style="margin:8px 0 0;font-size:12px;color:#6b7280">${date}</p>`,
    distance != null ? `    <p style="margin:4px 0 0;font-size:12px;color:#6b7280">Distance from the office: ${Math.round(distance)}m</p>` : '',
    '  </div>',
    '</div>'
  ].filter(Boolean).join('\n')

  return sendMail({ to: email, subject, text, html })
}

export default sendMail