import { useState, useEffect, useCallback } from 'react'
import { MapPin, RefreshCw, CheckCircle2, XCircle } from 'lucide-react'
import { getClockedPosition, haversineDistance } from '../services/locationService'

export default function LocationChecker({ company, onLocationChange }) {
  const [location, setLocation] = useState(null)
  const [checking, setChecking] = useState(false)
  const [error, setError] = useState(null)

  const getLocation = useCallback(async () => {
    setChecking(true)
    setError(null)
    try {
      const position = await getClockedPosition()
      setLocation(position)
      if (onLocationChange) onLocationChange(position)
    } catch (err) {
      setError(err.message)
      setLocation(null)
      if (onLocationChange) onLocationChange(null)
    } finally {
      setChecking(false)
    }
  }, [onLocationChange, company])

  useEffect(() => {
    getLocation()
  }, [getLocation])

  if (!company) {
    return (
      <div className="flex items-center gap-2 text-amber-600 text-sm p-4 bg-amber-50 rounded-lg">
        <MapPin size={18} />
        <span>Company location not configured yet.</span>
      </div>
    )
  }

  const distance = location
    ? haversineDistance(company.latitude, company.longitude, location.latitude, location.longitude)
    : null
  const within = distance !== null && distance <= (company.radius || 50)

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-gray-700 font-semibold text-sm">
          <MapPin size={18} className="text-brand-600" />
          Current Location
        </div>
        <button
          onClick={getLocation}
          disabled={checking}
          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
          aria-label="Refresh location"
        >
          <RefreshCw size={16} className={checking ? 'animate-spin' : ''} />
        </button>
      </div>

      {error && (
        <div className="flex items-start gap-2 bg-red-50 text-red-700 rounded-lg p-3 text-sm mb-3">
          <XCircle size={16} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {checking && !location && (
        <div className="text-sm text-gray-500 flex items-center gap-2 py-4">
          <RefreshCw size={16} className="animate-spin" />
          Acquiring GPS position...
        </div>
      )}

      {location && !error && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Distance from company</span>
            <span className="font-bold text-gray-900">
              {distance !== null ? `${Math.round(distance)}m` : '-'}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">GPS accuracy</span>
            <span className="font-medium text-gray-700">
              {location.accuracy ? `±${Math.round(location.accuracy)}m` : '-'}
            </span>
          </div>
          {within ? (
            <div className="flex items-center gap-2 text-green-700 text-sm font-medium">
              <CheckCircle2 size={16} />
              Within permitted area ({company.radius || 50}m)
            </div>
          ) : (
            <div className="flex items-center gap-2 text-red-600 text-sm font-medium">
              <XCircle size={16} />
              Outside permitted area ({company.radius || 50}m)
            </div>
          )}
        </div>
      )}
    </div>
  )
}