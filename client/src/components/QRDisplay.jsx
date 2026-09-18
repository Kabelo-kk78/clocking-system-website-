import { QRCodeSVG } from 'qrcode.react'

export default function QRDisplay({ value, size = 220, title = null }) {
  return (
    <div className="flex flex-col items-center gap-3">
      {title && (
        <p className="text-sm font-semibold text-gray-700">{title}</p>
      )}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
        <QRCodeSVG
          value={value}
          size={size}
          level="M"
          includeMargin
          fgColor="#111827"
          bgColor="#ffffff"
        />
      </div>
    </div>
  )
}