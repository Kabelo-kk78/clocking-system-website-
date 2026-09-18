import QRCode from 'qrcode'
import { sendDailyQREmail as mailDailyQR, isMailerConfigured, getMailMode } from './mailer.js'

export const renderQrDataUrl = (value) =>
  QRCode.toDataURL(value, { width: 300, margin: 2, errorCorrectionLevel: 'M', color: { dark: '#111827', light: '#ffffff' } })

export const sendDailyQREmail = mailDailyQR

export const getMailerMode = getMailMode

export const isResendConfigured = isMailerConfigured