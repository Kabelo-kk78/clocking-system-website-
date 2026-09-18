import { getActiveShift } from './qrService.js'
import { sendShiftQrEmails, wasShiftEmailed } from './shiftQrMailer.js'

let running = false

const tick = async () => {
  if (running) return
  running = true
  try {
    if ((process.env.QR_EMAIL_AUTO || 'true').toLowerCase() === 'false') return

    const active = getActiveShift()
    if (!active.shift) return

    if (await wasShiftEmailed(active.date, active.shift.key)) return

    const result = await sendShiftQrEmails({ date: active.date, shiftKey: active.shift.key })
    if (!result.skipped && result.sent > 0) {
      console.log(`[QR email] ${result.shiftLabel} QR → ${result.sent} employee(s) (${result.mode})`)
    }
  } catch (err) {
    console.error('[QR email scheduler]', err.message)
  } finally {
    running = false
  }
}

export const startQrEmailScheduler = () => {
  const seconds = Math.max(5, parseInt(process.env.QR_EMAIL_CHECK_SECONDS || '30', 10))
  const timer = setInterval(tick, seconds * 1000)
  timer.unref?.()
  console.log(`[QR email] scheduler active (checks every ${seconds}s).`)
  tick()
}