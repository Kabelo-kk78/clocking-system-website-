import { useState, useEffect, useCallback } from 'react'
import { getCurrentPosition } from '../services/locationService'

export default function useGeolocation(options = { watch: false }) {
  const [location, setLocation] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const position = await getCurrentPosition()
      setLocation(position)
      return position
    } catch (err) {
      setError(err.message)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()

    if (options.watch && navigator.geolocation) {
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: new Date().toISOString()
          })
        },
        (err) => setError(err.message),
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 30000 }
      )
      return () => navigator.geolocation.clearWatch(watchId)
    }
  }, [refresh, options.watch])

  return { location, error, loading, refresh }
}