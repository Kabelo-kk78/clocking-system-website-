import { getGeofence } from "@/lib/geofence";

export const metadata = { title: "Settings" };

export default async function AdminSettingsPage() {
  const geofence = getGeofence();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-neutral-400">System configuration</p>
      </div>

      <div className="glass-card p-5">
        <h2 className="mb-4 text-lg font-semibold">Office Geofence</h2>
        <p className="mb-4 text-sm text-neutral-400">
          Employees can only clock in when they are within this radius of the workplace.
        </p>
        <dl className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg bg-neutral-900 p-4">
            <dt className="text-xs text-neutral-500">Latitude</dt>
            <dd className="mt-1 font-mono text-lg">{geofence.latitude}</dd>
          </div>
          <div className="rounded-lg bg-neutral-900 p-4">
            <dt className="text-xs text-neutral-500">Longitude</dt>
            <dd className="mt-1 font-mono text-lg">{geofence.longitude}</dd>
          </div>
          <div className="rounded-lg bg-neutral-900 p-4">
            <dt className="text-xs text-neutral-500">Radius</dt>
            <dd className="mt-1 font-mono text-lg">{geofence.radiusMeters} m</dd>
          </div>
        </dl>
        <p className="mt-4 text-xs text-neutral-500">
          To change the geofence, update GEOFENCE_LATITUDE, GEOFENCE_LONGITUDE and
          GEOFENCE_RADIUS_METERS in your environment variables.
        </p>
      </div>

      <div className="glass-card p-5">
        <h2 className="mb-4 text-lg font-semibold">Daily QR Code Schedule</h2>
        <p className="text-sm text-neutral-400">
          Unique QR codes for every active employee are generated automatically every day at
          07:00 (Africa/Johannesburg) via a scheduled job, and emailed to each employee.
        </p>
      </div>
    </div>
  );
}