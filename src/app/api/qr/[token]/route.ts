import QRCode from "qrcode";
import { buildCheckInUrl } from "@/lib/qr";

export const dynamic = "force-dynamic";

const TOKEN_PATTERN = /^[A-Za-z0-9-]{6,128}$/;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  if (!TOKEN_PATTERN.test(token)) {
    return new Response("Not found", { status: 404 });
  }

  const buffer = await QRCode.toBuffer(buildCheckInUrl(token), {
    type: "png",
    width: 400,
    margin: 2,
  });

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=86400",
      "Content-Length": String(buffer.length),
    },
  });
}