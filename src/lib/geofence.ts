export interface GeofenceConfig {
  latitude: number;
  longitude: number;
  radiusMeters: number;
}

export function getGeofence(): GeofenceConfig {
  const latitude = Number(process.env.GEOFENCE_LATITUDE);
  const longitude = Number(process.env.GEOFENCE_LONGITUDE);
  const radiusMeters = Number(process.env.GEOFENCE_RADIUS_METERS ?? "50");

  return { latitude, longitude, radiusMeters };
}

export function haversineDistanceMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export function isWithinGeofence(lat: number, lng: number): boolean {
  const { latitude, longitude, radiusMeters } = getGeofence();
  const distance = haversineDistanceMeters(lat, lng, latitude, longitude);
  return distance <= radiusMeters;
}

export function distanceFromGeofenceMeters(lat: number, lng: number): number {
  const { latitude, longitude } = getGeofence();
  return haversineDistanceMeters(lat, lng, latitude, longitude);
}