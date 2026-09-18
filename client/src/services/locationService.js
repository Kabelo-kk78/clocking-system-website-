const EARTH_RADIUS = 6371000

export const getCurrentPosition = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('GPS is not supported on this device.'))
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: new Date().toISOString()
        })
      },
      (error) => {
        const messages = {
          1: 'Location permission was denied. Please allow location access to clock in/out.',
          2: 'GPS position is unavailable. Please check your device settings.',
          3: 'GPS timed out. Please try again.'
        }
        reject(new Error(messages[error.code] || 'Unable to get your location.'))
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 30000 }
    )
  })
}

export const getClockedPosition = () => getCurrentPosition()

export const haversineDistance = (lat1, lon1, lat2, lon2) => {
  const toRad = (deg) => (deg * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return EARTH_RADIUS * c
}

export const isWithinRadius = (distance, radius) => distance <= radius

export const formatDistance = (metres) => {
  if (metres === null || metres === undefined) return '-'
  if (metres >= 1000) return `${(metres / 1000).toFixed(2)}km`
  return `${Math.round(metres)}m`
}