import { useState, useEffect, useCallback } from 'react'
import { ScanLine, MapPin, LogIn, LogOut, AlertCircle, CheckCircle2, Info, Loader2 } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { getCompany, getTodayAttendance, getDailyQR, clockIn, clockOut } from '../../services/attendanceService'
import { getCurrentPosition, haversineDistance } from '../../services/locationService'
import { parseQrPayload } from '../../services/qrPayload'
import { todayISO } from '../../utils/dateUtils'
import QRScanner from '../../components/QRScanner'
import LocationChecker from '../../components/LocationChecker'

export default function EmployeeClockIn() {
  const { userData } = useAuth()
  const [company, setCompany] = useState(null)
  const [location, setLocation] = useState(null)
  const [today, setToday] = useState(null)
  const [hasQr, setHasQr] = useState(false)
  const [qrMessage, setQrMessage] = useState(null)
  const [processing, setProcessing] = useState(false)
  const [message, setMessage] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async (loc) => {
    setQrMessage(null)
    try {
      const [cmp, att] = await Promise.all([
        getCompany(),
        getTodayAttendance(userData?.uid)
      ])
      let qr = null
      try {
        qr = await getDailyQR(todayISO())
      } catch (err) {
        if (err.status === 404) setQrMessage(err.message || 'No active QR code for this shift yet.')
      }
      setCompany(cmp)
      setToday(att)
      setHasQr(!!qr)
      if (loc) setLocation(loc)
    } finally {
      setLoading(false)
    }
  }, [userData])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleLocationChange = (loc) => {
    setLocation(loc)
  }

  const handleScan = async (value) => {
    setProcessing(true)
    setMessage(null)
    setError(null)

    try {
      if (!location) throw new Error('Location is required. Refresh your location first.')

      let token = value
      let building = company

      try {
        const payload = parseQrPayload(value)
        if (payload?.token) token = payload.token
        if (payload && payload.lat != null && payload.lng != null) {
          building = {
            latitude: payload.lat,
            longitude: payload.lng,
            radius: payload.radius || 50
          }
        }
      } catch {}

      if (!building || building.latitude == null || building.longitude == null) {
        throw new Error('The QR code does not contain a valid building location.')
      }

      const distance = haversineDistance(
        building.latitude,
        building.longitude,
        location.latitude,
        location.longitude
      )

      if (distance > (building.radius || company?.radius || 50)) {
        throw new Error(`You are ${Math.round(distance)}m from company premises (max allowed ${building.radius || company?.radius || 50}m).`)
      }

      if (!today?.clockIn) {
        const result = await clockIn(token, location)
        setMessage({ type: 'success', text: `Clocked in at ${formatNow()}.` })
        await loadData(location)
        if (result.logged) setMessage({ type: 'success', text: `Clocked in at ${formatNow()}. ${result.logged}` })
      } else if (!today.clockOut) {
        const result = await clockOut(token, location)
        setMessage({ type: 'success', text: `Clocked out at ${formatNow()}. Duration: ${result.duration || '-'}` })
        await loadData(location)
      } else {
        setError('You have already clocked in and out for today.')
      }
    } catch (err) {
      setError(err.message || 'Action failed. Please try again.')
    } finally {
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="py-6 text-center">
        <Loader2 className="animate-spin text-brand-600 mx-auto mb-3" size={32} />
        <p className="text-gray-500 text-sm">Loading...</p>
      </div>
    )
  }

  const formatNow = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  const withinRadius = location && company
    ? haversineDistance(company.latitude, company.longitude, location.latitude, location.longitude) <= (company.radius || 50)
    : false

  return (
    <div className="py-6 max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Clock In / Out</h1>
        <p className="text-sm text-gray-500 mt-1">Scan today's QR code to record your attendance</p>
      </div>

      {message && (
        <div className="flex items-start gap-2 bg-green-50 text-green-700 rounded-lg p-3 text-sm mb-4">
          <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
          <span>{message.text}</span>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 bg-red-50 text-red-700 rounded-lg p-3 text-sm mb-4">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {qrMessage && (
        <div className="flex items-start gap-2 bg-blue-50 text-blue-800 rounded-lg p-3 text-sm mb-4">
          <Info size={16} className="mt-0.5 shrink-0" />
          <span>{qrMessage}</span>
        </div>
      )}

      <div className="space-y-4 mb-6">
        <LocationChecker company={company} onLocationChange={handleLocationChange} />

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-gray-500">Today's date</span>
            <span className="font-semibold text-gray-800">{todayISO()}</span>
          </div>
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-gray-500">Daily QR available</span>
            {hasQr ? (
              <span className="font-semibold text-green-700">Yes</span>
            ) : qrMessage ? (
              <span className="font-semibold text-amber-600">No — waiting for the shift window</span>
            ) : (
              <span className="font-semibold text-amber-600">No — ask admin</span>
            )}
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Today's status</span>
            <span className="font-semibold text-gray-800 capitalize">
              {today?.clockIn
                ? today.clockOut
                  ? `Clocked out at ${new Date(today.clockOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                  : 'Clocked in'
                : 'Ready to clock in'}
            </span>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-center gap-2 mb-1 text-gray-500 text-sm">
          <ScanLine size={16} />
          <span>{today?.clockIn && !today.clockOut ? 'Scan QR to clock out' : 'Scan today\'s QR code'}</span>
        </div>
        <p className="text-center text-xs text-gray-400 mb-4">This is the current day's code only — expired codes are rejected.</p>

        {!withinRadius ? (
          <div className="flex items-center gap-2 justify-center text-amber-600 text-sm bg-amber-50 rounded-lg p-4">
            <MapPin size={18} />
            Move within {company?.radius || 50}m of company premises and refresh your location to clock in.
          </div>
        ) : (
          <QRScanner onScan={handleScan} onError={(err) => setError(err.message)} />
        )}

        {processing && (
          <div className="flex items-center justify-center gap-2 text-brand-600 text-sm mt-4">
            <Loader2 size={18} className="animate-spin" />
            Processing...
          </div>
        )}
      </div>
    </div>
  )
}