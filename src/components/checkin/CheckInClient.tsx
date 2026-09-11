"use client";

import { useState } from "react";
import { checkInAction } from "@/actions/attendance/checkInAction";
import type { GeofenceConfig } from "@/lib/geofence";
import { formatTimeSA } from "@/lib/dates";

interface CheckInClientProps {
  token: string;
  geofence: GeofenceConfig;
}

type Phase = "idle" | "locating" | "done";
type Outcome = {
  success: boolean;
  message: string;
  data?: {
    fullName: string;
    clockInAt: Date;
    distance: number;
    withinRadiusMeters: number;
    status: string;
  };
} | null;

export default function CheckInClient({ token, geofence }: CheckInClientProps) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [outcome, setOutcome] = useState<Outcome>(null);
  const [clockInTime, setClockInTime] = useState<string | null>(null);

  async function handleClockIn() {
    setPhase("locating");
    setOutcome(null);

    if (!navigator.geolocation) {
      setOutcome({ success: false, message: "Geolocation is not supported on this device." });
      setPhase("idle");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const result = await checkInAction({
          token,
          latitude,
          longitude,
        });
        setOutcome(result);
        if (result.success) {
          setClockInTime(formatTimeSA(result.data?.clockInAt ?? new Date()));
        }
        setPhase("done");
      },
      (error) => {
        setOutcome({
          success: false,
          message:
            error.code === error.PERMISSION_DENIED
              ? "Location permission was denied. Allow location access to clock in."
              : "Could not determine your location. Try again.",
        });
        setPhase("done");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }

  return (
    <div className="glass-card w-full max-w-md p-8 text-center">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#FFC107] text-3xl">
        ⏰
      </div>
      <h1 className="text-2xl font-bold">Clock In</h1>
      <p className="mt-2 text-sm text-neutral-400">
        You must be within{" "}
        <span className="font-semibold text-amber-400">
          {geofence.radiusMeters}m
        </span>{" "}
        of the workplace to clock in.
      </p>

      {phase !== "done" && (
        <button
          onClick={handleClockIn}
          disabled={phase === "locating"}
          className="mt-8 w-full rounded-lg bg-[#FFC107] px-4 py-3 text-sm font-bold text-[#0f1117] transition hover:bg-amber-400 disabled:opacity-60"
        >
          {phase === "locating" ? "Locating you…" : "Get My Location & Clock In"}
        </button>
      )}

      {phase === "done" && outcome && (
        <div
          className={`mt-6 rounded-xl border p-4 text-left ${
            outcome.success
              ? "border-green-500/30 bg-green-500/10"
              : "border-red-500/30 bg-red-500/10"
          }`}
        >
          <p className={`font-semibold ${outcome.success ? "text-green-400" : "text-red-400"}`}>
            {outcome.success ? "✓ " : "✕ "}
            {outcome.message}
          </p>
          {outcome.success && outcome.data && (
            <div className="mt-3 space-y-1 text-sm text-neutral-300">
              <p>
                Employee: <span className="font-semibold text-white">{outcome.data.fullName}</span>
              </p>
              <p>
                Clock-in time: <span className="font-semibold text-white">{clockInTime}</span>
              </p>
              <p>
                Distance from geofence:{" "}
                <span className="font-semibold text-white">
                  {Math.round(outcome.data.distance)}m
                </span>
              </p>
              <p>
                Status:{" "}
                <span
                  className={`font-semibold uppercase ${
                    outcome.data.status === "late" ? "text-amber-400" : "text-green-400"
                  }`}
                >
                  {outcome.data.status}
                </span>
              </p>
            </div>
          )}
        </div>
      )}

      {phase === "done" && !outcome?.success && (
        <button
          onClick={handleClockIn}
          className="mt-6 w-full rounded-lg border border-neutral-700 px-4 py-2.5 text-sm font-semibold text-neutral-300 transition hover:bg-neutral-800"
        >
          Try Again
        </button>
      )}
    </div>
  );
}