import { useState } from 'react'
import { ScanLine, AlertCircle, CheckCircle2, MapPin } from 'lucide-react'
import QRScanner from '../../components/QRScanner'
import { validateTokenOnServer } from '../../services/qrService'
import { getCurrentPosition, haversineDistance } from '../../services/locationService'
import { parseQrPayload } from '../../services/qrPayload'
import { getCompany } from '../../services/attendanceService'
import Loading from '../../components/Loading'

export default function AdminQRScanner() {
  const [scanResult, setScanResult] = useState(null)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState(null)

  const handleScan = async (decodedText) => {
    setProcessing(true)
    setError(null)
    setScanResult(null)

    try {
      const payload = parseQrPayload(decodedText)
      const token = payload?.token || decodedText

      const company = await getCompany()
      const building = payload && payload.lat != null && payload.lng != null
        ? { latitude: payload.lat, longitude: payload.lng, radius: payload.radius || 50 }
        : company

      if (!building || building.latitude == null || building.longitude == null) {
        throw new Error('The scanned QR code does not contain a valid building location.')
      }

      let location = null
      try {
        location = await getCurrentPosition()
      } catch {
        location = null
      }

      let distance = null
      if (location) {
        distance = haversineDistance(
          building.latitude,
          building.longitude,
          location.latitude,
          location.longitude
        )
      }

      const radius = Number(building.radius) || 50
      const result = await validateTokenOnServer(token, location)

      const withinRadius = distance !== null && distance <= radius

      let statusLabel = 'Rejected'
      if (result.valid) {
        statusLabel = withinRadius
          ? 'VERIFIED — within 50m'
          : location
          ? 'REJECTED — outside permitted area'
          : 'REJECTED — location could not be checked'
      }

      setScanResult({
        token,
        valid: result.valid && withinRadius,
        message: `${statusLabel}${result.valid ? ' · ' + result.message : ' · ' + (result.message || 'QR invalid or expired')}`,
        distance,
        radius,
        building,
        time: new Date()
      })
    } catch (err) {
      setError(err.message || 'QR validation failed.')
      setScanResult({ valid: false, message: err.message })
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="py-6 max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-brand-600 text-white mb-4">
          <ScanLine size={28} />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">QR Scanner</h1>
        <p className="text-sm text-gray-500 mt-1">Scan an employee's QR code to verify they are within the geofence</p>
      </div>

      {error && (
        <div className="flex items-start gap-2 bg-red-50 text-red-700 rounded-lg p-3 text-sm mb-4">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="card">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Camera</p>
        <div className="bg-black rounded-xl p-2 min-h-[240px] flex items-center justify-center">
          {processing ? (
            <Loading small message="Validating QR + proximity..." />
          ) : (
            <QRScanner onScan={handleScan} onError={(err) => setError(err.message)} />
          )}
        </div>

        {scanResult && !processing && (
          <div className={`mt-4 rounded-xl p-4 ${scanResult.valid ? 'bg-green-50' : 'bg-red-50'}`}>
            <div className="flex items-center gap-2 mb-2">
              {scanResult.valid ? (
                <CheckCircle2 size={18} className="text-green-600" />
              ) : (
                <AlertCircle size={18} className="text-red-600" />
              )}
              <span className={`font-semibold ${scanResult.valid ? 'text-green-800' : 'text-red-800'}`}>
                {scanResult.valid ? 'VERIFIED' : 'NOT VERIFIED'}
              </span>
            </div>
            <p className="text-sm text-gray-700 mb-1">{scanResult.message}</p>
            {scanResult.distance !== null && (
              <p className="text-xs text-gray-500">
                Distance: {Math.round(scanResult.distance)}m (allowed {scanResult.radius}m)
              </p>
            )}
            {scanResult.building && scanResult.building.latitude != null && (
              <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                <MapPin size={12} />
                Building (from scanned QR): {Number(scanResult.building.latitude).toFixed(5)},{' '}
                {Number(scanResult.building.longitude).toFixed(5)}
              </p>
            )}
            {scanResult.time && (
              <p className="text-xs text-gray-500 mt-1">
                Scanned at {scanResult.time.toLocaleTimeString()}
              </p>
            )}
          </div>
        )}

        {!scanResult && !processing && !error && (
          <p className="text-center text-gray-400 text-sm mt-4">
            Point your camera at the employee's daily QR code. A code is only VERIFIED when the
            scanning device is inside the 50m building geofence.
          </p>
        )}

      </div>
    </div>
  )
}