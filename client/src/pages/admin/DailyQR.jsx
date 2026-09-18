import { useState, useEffect } from 'react'
import { QrCode, RefreshCw, AlertCircle, CheckCircle2, Clock, Timer, Mail, MapPin, Building2 } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { generateDailyQR, getTodayToken, revokeDailyQR, emailDailyQR } from '../../services/qrService'
import { getCompany } from '../../services/attendanceService'
import { buildQrPayload } from '../../services/qrPayload'
import { todayISO, formatDateTime } from '../../utils/dateUtils'
import Loading from '../../components/Loading'
import QRDisplay from '../../components/QRDisplay'

export default function AdminDailyQR() {
  const { user } = useAuth()
  const [qr, setQr] = useState(null)
  const [company, setCompany] = useState(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [emailing, setEmailing] = useState(false)
  const [error, setError] = useState(null)
  const [info, setInfo] = useState(null)
  const [success, setSuccess] = useState(null)

  const loadQr = async () => {
    setLoading(true)
    setError(null)
    setInfo(null)
    try {
      const [todayQr, cmp] = await Promise.all([getTodayToken(), getCompany()])
      setQr(todayQr)
      setCompany(cmp)
    } catch (err) {
      setQr(null)
      setError(null)
      setInfo(err.status === 404 ? err.message : null)
      setError(err.status === 404 ? null : err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadQr()
  }, [])

  const qrValue = qr
    ? qr.payload || (company ? buildQrPayload({ token: qr.token, date: qr.date, company }) : qr.token)
    : null

  const handleGenerate = async () => {
    setGenerating(true)
    setError(null)
    setSuccess(null)
    setInfo(null)
    try {
      const result = await generateDailyQR()
      setQr(result)
      setSuccess(`${result.shiftLabel || 'Daily'} QR code generated for ${result.date}.`)
      if (!company) setCompany(await getCompany().catch(() => null))
    } catch (err) {
      setInfo(err.status === 404 || err.status === 400 ? err.message : null)
      setError(err.status === 404 || err.status === 400 ? null : err.message || 'Failed to generate QR code.')
    } finally {
      setGenerating(false)
    }
  }

  const handleRevoke = async () => {
    if (!window.confirm('Revoking this QR code will invalidate today\'s shift token. Continue?')) return
    setError(null)
    setSuccess(null)
    setInfo(null)
    try {
      await revokeDailyQR()
      setQr(null)
      setSuccess('QR code revoked. The next shift window will auto-generate a new code.')
    } catch (err) {
      setError(err.message || 'Failed to revoke QR code.')
    }
  }

  const handleEmail = async () => {
    setEmailing(true)
    setError(null)
    setSuccess(null)
    setInfo(null)
    try {
      const result = await emailDailyQR()
      setSuccess(
        result.failed
          ? `${result.shiftLabel || 'Daily'} QR emailed to ${result.sent} employee(s), ${result.failed} failed.`
          : `Daily QR emailed to ${result.sent} employee(s).`
      )
      if (result.mode === 'console' || result.mode === 'demo') {
        setSuccess(
          `${result.shiftLabel || 'Daily'} QR recorded for ${result.sent} employee(s) (${result.mode} mode). Configure an email provider in server/.env to send real emails.`
        )
      }
    } catch (err) {
      setInfo(err.status === 404 ? err.message : null)
      setError(err.status === 404 ? null : err.message || 'Failed to email the QR code.')
    } finally {
      setEmailing(false)
    }
  }

  if (loading) return <Loading message="Loading today's QR code..." />

  return (
    <div className="py-6 max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-brand-600 text-white mb-4">
          <QrCode size={28} />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Daily QR Code</h1>
        <p className="text-sm text-gray-500 mt-1">Generate today's secure attendance token</p>
      </div>

      {error && (
        <div className="flex items-start gap-2 bg-red-50 text-red-700 rounded-lg p-3 text-sm mb-4">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {info && (
        <div className="flex items-start gap-2 bg-blue-50 text-blue-800 rounded-lg p-3 text-sm mb-4">
          <Clock size={16} className="mt-0.5 shrink-0" />
          <span>{info}</span>
        </div>
      )}

      {success && (
        <div className="flex items-start gap-2 bg-green-50 text-green-700 rounded-lg p-3 text-sm mb-4">
          <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-semibold text-gray-900">{todayISO()}</h2>
            <p className="text-xs text-gray-500">
              {new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          {qr && (
            <div className="flex flex-col items-end gap-1">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-green-600 animate-pulse" />
                Active
              </span>
              {qr.shiftLabel && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-brand-100 text-brand-800 rounded-full text-xs font-medium">
                  {qr.shiftLabel} · {qr.windowStart}–{qr.windowEnd}
                </span>
              )}
            </div>
          )}
        </div>

        {qr ? (
          <div className="flex flex-col items-center">
            <QRDisplay value={qrValue} size={230} />
            <div className="mt-4 w-full space-y-2 text-sm">
              <div className="flex justify-between px-2">
                <span className="text-gray-500 flex items-center gap-1.5">
                  <Clock size={14} /> Shift window
                </span>
                <span className="font-medium text-gray-700">
                  {qr.shiftLabel || 'Daily'} · {qr.windowStart || '—'} to {qr.windowEnd || '—'}
                </span>
              </div>
              <div className="flex justify-between px-2">
                <span className="text-gray-500 flex items-center gap-1.5">
                  <Timer size={14} /> Generated
                </span>
                <span className="font-medium text-gray-700">{formatDateTime(qr.createdAt)}</span>
              </div>
              <div className="flex justify-between px-2">
                <span className="text-gray-500 flex items-center gap-1.5">
                  <Timer size={14} /> Expires
                </span>
                <span className="font-medium text-gray-700">{formatDateTime(qr.expiresAt)}</span>
              </div>
              {qr.closeOfBusiness && (
                <div className="flex justify-between px-2">
                  <span className="text-gray-500 flex items-center gap-1.5">
                    <Building2 size={14} /> Close of business
                  </span>
                  <span className="font-medium text-gray-700">{qr.closeOfBusiness}</span>
                </div>
              )}
              {company && company.latitude != null && company.longitude != null && (
                <div className="flex justify-between px-2">
                  <span className="text-gray-500 flex items-center gap-1.5">
                    <MapPin size={14} /> Building location on device
                  </span>
                  <span className="font-medium text-gray-700">
                    {Number(company.latitude).toFixed(5)}, {Number(company.longitude).toFixed(5)} (±{company.radius || 50}m)
                  </span>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 text-gray-400 mb-4">
              <QrCode size={32} />
            </div>
            <p className="text-gray-700 font-medium">No shift window open right now</p>
            <p className="text-sm text-gray-500 mt-1">
              The next QR auto-generates automatically at the start of the next shift window (08:00 & 16:30).
            </p>
          </div>
        )}

        <div className="flex gap-3 mt-6">
          {qr ? (
            <>
              <button onClick={handleRevoke} disabled={generating || emailing} className="btn-secondary flex-1">
                Revoke Code
              </button>
              <button onClick={handleGenerate} disabled={generating || emailing} className="btn-primary flex-1">
                {generating && <RefreshCw size={16} className="animate-spin" />}
                Regenerate
              </button>
            </>
          ) : (
            <button onClick={handleGenerate} disabled={generating || emailing} className="btn-primary w-full">
              {generating ? <RefreshCw size={18} className="animate-spin" /> : <QrCode size={18} />}
              {generating ? 'Generating...' : 'Generate Current Shift\'s QR Code'}
            </button>
          )}
        </div>

        {qr && (
          <div className="mt-4 border-t pt-4">
            <button onClick={handleEmail} disabled={emailing} className="btn-primary w-full">
              <Mail size={18} />
              {emailing ? 'Emailing all employees...' : 'Email Today\'s QR to All Employees'}
            </button>
            <p className="text-xs text-gray-500 mt-2 text-center">
              Emails the current shift's QR (with the building location embedded) to every active employee.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}