'use client'

import { useState, useEffect } from 'react'

export default function OnlineStatus() {
  const [isOnline, setIsOnline] = useState(() => navigator.onLine)

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  if (isOnline) return null
  return (
    <div className="fixed top-0 left-0 right-0 bg-amber-500 text-gray-900 px-4 py-3 text-center font-medium shadow-lg z-50">
      📴 You&apos;re offline — Changes will sync when you reconnect
    </div>
  )
}
