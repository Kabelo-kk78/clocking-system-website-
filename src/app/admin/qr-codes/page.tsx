import { auth } from "@/lib/auth";
import { todaySA, WORK_START_TIME } from "@/lib/dates";
import { getGeofence } from "@/lib/geofence";
import { getDailyQrOverview } from "@/services/qr/getDailyQrOverview";
import { getEmailSetupStatus } from "@/services/email/getEmailSetupStatus";
import QrCodesManager from "@/components/admin/QrCodesManager";

export const metadata = { title: "Daily QR Codes" };

export default async function AdminQrCodesPage() {
  const session = await auth();
  const today = todaySA();

  const [overview, emailStatus, geofence] = await Promise.all([
    getDailyQrOverview(today),
    getEmailSetupStatus(),
    Promise.resolve(getGeofence()),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Daily QR Codes</h1>
        <p className="text-sm text-neutral-400">
          Unique QR codes for each employee — scanned on their device when they arrive.
        </p>
      </div>

      <QrCodesManager
        date={today}
        overview={overview}
        geofence={geofence}
        workStartTime={WORK_START_TIME}
        emailStatus={emailStatus}
        adminEmail={session?.user?.email ?? ""}
      />
    </div>
  );
}