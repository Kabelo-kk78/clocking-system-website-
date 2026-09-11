import QRCode from "qrcode";

export function generateQrToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export function getAppUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

export function buildCheckInUrl(token: string): string {
  return `${getAppUrl()}/checkin/${token}`;
}

export function buildQrImageUrl(token: string): string {
  return `${getAppUrl()}/api/qr/${encodeURIComponent(token)}`;
}

export async function generateQrDataUrl(content: string): Promise<string> {
  return QRCode.toDataURL(content, { width: 400, margin: 2 });
}