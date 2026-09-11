import type { Metadata } from "next";
import CheckInClient from "@/components/checkin/CheckInClient";
import { getGeofence } from "@/lib/geofence";

export const metadata: Metadata = { title: "Clock In" };

interface PageProps {
  params: Promise<{ token: string }>;
}

export default async function CheckInPage({ params }: PageProps) {
  const { token } = await params;
  const geofence = getGeofence();

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0f1117] p-6">
      <CheckInClient token={token} geofence={geofence} />
    </main>
  );
}