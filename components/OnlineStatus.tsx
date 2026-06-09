'use client'

import { useSyncExternalStore } from 'react'

function subscribeToOnlineStatus(onStoreChange: () => void) {
  window.addEventListener('online', onStoreChange)
  window.addEventListener('offline', onStoreChange)

  return () => {
    window.removeEventListener('online', onStoreChange)
    window.removeEventListener('offline', onStoreChange)
  }
}

const getOnlineStatus = () => navigator.onLine
const getServerOnlineStatus = () => true

export default function OnlineStatus() {
  const isOnline = useSyncExternalStore(
    subscribeToOnlineStatus,
    getOnlineStatus,
    getServerOnlineStatus
  )

  if (isOnline) return null
  return (
    <div className="fixed top-0 left-0 right-0 bg-amber-500 text-gray-900 px-4 py-3 text-center font-medium shadow-lg z-50">
      📴 You&apos;re offline — Changes will sync when you reconnect
    </div>
  )
}
