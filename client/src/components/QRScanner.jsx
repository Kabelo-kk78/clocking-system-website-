import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { ScanLine, XCircle } from 'lucide-react'

export default function QRScanner({ onScan, onError }) {
  const [scanning, setScanning] = useState(false)
  const [error, setError] = useState(null)
  const scannerRef = useRef(null)
  const html5QrRef = useRef(null)

  const startScanner = async () => {
    setScanning(true)
    setError(null)

    try {
      const html5QrCode = new Html5Qrcode('qr-reader')
      html5QrRef.current = html5QrCode

      await html5QrCode.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          stopScanner(false)
          if (onScan) onScan(decodedText)
        },
        () => {}
      )
    } catch (err) {
      setError(err.message || 'Unable to access camera.')
      setScanning(false)
      if (onError) onError(err)
    }
  }

  const stopScanner = async (clearError = true) => {
    if (html5QrRef.current) {
      try {
        await html5QrRef.current.stop()
        await html5QrRef.current.clear()
      } catch {}
      html5QrRef.current = null
    }
    setScanning(false)
    if (clearError) setError(null)
  }

  useEffect(() => {
    return () => {
      if (html5QrRef.current) {
        try {
          html5QrRef.current.stop().catch(() => {})
        } catch {}
      }
    }
  }, [])

  return (
    <div className="w-full">
      <div
        id="qr-reader"
        className={`qr-scanner overflow-hidden rounded-xl bg-black min-h-[280px] ${
          scanning ? 'block' : 'hidden'
        }`}
      />

      {error && (
        <div className="mt-4 flex items-start gap-2 bg-red-50 text-red-700 rounded-lg p-3 text-sm">
          <XCircle size={18} className="mt-0.5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {scanning ? (
        <button
          onClick={() => stopScanner()}
          className="btn-secondary w-full mt-4"
        >
          Stop Scanner
        </button>
      ) : (
        <button onClick={startScanner} className="btn-primary w-full mt-4">
          <ScanLine size={18} />
          Start Scanner
        </button>
      )}
    </div>
  )
}