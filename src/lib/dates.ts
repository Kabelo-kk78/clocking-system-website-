export const WORK_START_TIME = process.env.WORK_START_TIME ?? "08:00";

export const TIMEZONE = "Africa/Johannesburg";

export function todaySA(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function partsInTimeZone(
  date: Date,
  timeZone: string
): { year: number; month: number; day: number } {
  const [year, month, day] = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .format(date)
    .split("-")
    .map(Number);
  return { year, month, day };
}

function timeZoneOffsetMs(date: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(date);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? "0");
  const asUTC = Date.UTC(
    get("year"),
    get("month") - 1,
    get("day"),
    get("hour"),
    get("minute"),
    get("second")
  );
  return asUTC - date.getTime();
}

export function getWorkStart(date: Date): Date {
  const [hours, minutes] = WORK_START_TIME.split(":").map(Number);
  const { year, month, day } = partsInTimeZone(date, TIMEZONE);
  const offset = timeZoneOffsetMs(date, TIMEZONE);
  const wallClock = Date.UTC(year, month - 1, day, hours, minutes);
  return new Date(wallClock - offset);
}

export function endOfDaySA(date: Date): Date {
  const { year, month, day } = partsInTimeZone(date, TIMEZONE);
  const offset = timeZoneOffsetMs(date, TIMEZONE);
  const wallClock = Date.UTC(year, month - 1, day, 23, 59, 59, 999);
  return new Date(wallClock - offset);
}

export function isLate(clockInAt: Date): boolean {
  const workStart = getWorkStart(clockInAt);
  return clockInAt.getTime() > workStart.getTime();
}

export function formatDateTimeSA(value: Date | string): string {
  const d = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("en-ZA", {
    timeZone: TIMEZONE,
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(d);
}

export function formatTimeSA(value: Date | string): string {
  const d = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("en-ZA", {
    timeZone: TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(d);
}

export function formatDateSA(value: Date | string): string {
  const d = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("en-ZA", {
    timeZone: TIMEZONE,
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(d);
}