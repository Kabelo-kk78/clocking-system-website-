import { Loader2 } from 'lucide-react'

export default function Loading({ fullScreen = false, message = 'Loading...', small = false }) {
  if (fullScreen) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-3">
        <Loader2 className="animate-spin text-brand-600" size={40} />
        <p className="text-gray-600 font-medium text-sm">{message}</p>
      </div>
    )
  }

  if (small) {
    return (
      <div className="flex items-center justify-center gap-2 text-gray-500 py-4">
        <Loader2 className="animate-spin" size={18} />
        <span className="text-sm">{message}</span>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center py-12">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="animate-spin text-brand-600" size={32} />
        <p className="text-gray-600 font-medium text-sm">{message}</p>
      </div>
    </div>
  )
}