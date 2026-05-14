import { useEffect } from 'react'
import { CheckCircle, AlertCircle, Info } from 'lucide-react'

export function Toast({ message, type = 'info' }) {
  const icons = {
    success: <CheckCircle className="w-5 h-5" />,
    error: <AlertCircle className="w-5 h-5" />,
    info: <Info className="w-5 h-5" />,
  }

  const colors = {
    success: 'bg-green-500/90 text-white',
    error: 'bg-red-500/90 text-white',
    info: 'bg-blue-500/90 text-white',
  }

  return (
    <div
      className={`toast glass backdrop-blur-xl rounded-lg px-4 py-3 flex items-center gap-3 animate-slide-up shadow-lg ${colors[type]}`}
    >
      {icons[type]}
      <span className="text-sm font-medium">{message}</span>
    </div>
  )
}
