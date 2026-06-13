'use client'

import { useSyncExternalStore } from 'react'
import Icon from './Icon'

const OFFLINE_DELAY_MS = 2000 // Wait 2s before showing offline banner (avoids flash on unstable connections)

function subscribeToOnlineStatus(onStoreChange: () => void) {
  let offlineTimer: ReturnType<typeof setTimeout> | null = null

  // Debounce offline events: delay notification to React so flaky wifi
  // that flickers between online/offline doesn't cause a visible flash.
  // Coming back online is instant — cancels any pending offline timer.
  const handleOnline = () => {
    if (offlineTimer) {
      clearTimeout(offlineTimer)
      offlineTimer = null
    }
    onStoreChange()
  }

  const handleOffline = () => {
    if (offlineTimer) clearTimeout(offlineTimer)
    offlineTimer = setTimeout(() => {
      offlineTimer = null
      onStoreChange()
    }, OFFLINE_DELAY_MS)
  }

  window.addEventListener('online', handleOnline)
  window.addEventListener('offline', handleOffline)

  return () => {
    window.removeEventListener('online', handleOnline)
    window.removeEventListener('offline', handleOffline)
    if (offlineTimer) clearTimeout(offlineTimer)
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
    <div className="fixed bottom-0 left-0 right-0 bg-amber-500 dark:bg-amber-600 text-gray-900 dark:text-gray-100 px-4 py-3 text-center font-medium shadow-lg z-50">
      <Icon name="offline" className="w-5 h-5 inline mr-2 align-text-bottom" />You&apos;re offline — Changes will sync when you reconnect
    </div>
  )
}
