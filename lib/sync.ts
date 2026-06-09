'use client'

import { getPendingTasks, markAsSynced, markAsFailed, Task } from './db'

const SYNC_INTERVAL = 30000 // 30 seconds
const MAX_RETRIES = 3
const RETRY_DELAY = 5000 // 5 seconds

let syncInProgress = false
let retryCount = 0

/**
 * Sync pending tasks with Firestore
 */
export async function syncTodos() {
  if (syncInProgress) return

  syncInProgress = true

  try {
    // Get all pending tasks
    const pendingTasks = await getPendingTasks()

    if (pendingTasks.length === 0) {
      console.log('[Sync] No pending tasks to sync')
      syncInProgress = false
      return
    }

    console.log(`[Sync] Syncing ${pendingTasks.length} pending task(s)...`)

    // Send to server API
    const response = await fetch('/api/tasks/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ tasks: pendingTasks }),
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const result = await response.json()

    if (!result.success) {
      throw new Error(result.error || 'Sync failed')
    }

    // Mark successfully synced tasks
    for (const taskId of result.syncedTasks) {
      await markAsSynced(taskId)
    }

    // Mark failed tasks for retry
    for (const taskId of result.failedTasks) {
      await markAsFailed(taskId)
    }

    console.log(`[Sync] Synced ${result.syncedCount} task(s), ${result.failedCount} failed`)

    retryCount = 0
  } catch (error) {
    console.error('[Sync] Error:', error)

    // Retry logic
    if (retryCount < MAX_RETRIES) {
      retryCount++
      console.log(`[Sync] Retry ${retryCount}/${MAX_RETRIES} in ${RETRY_DELAY}ms...`)
      setTimeout(syncTodos, RETRY_DELAY)
    } else {
      console.error('[Sync] Max retries exceeded')
      retryCount = 0
    }
  } finally {
    syncInProgress = false
  }
}

/**
 * Set up automatic sync when online
 */
export function setupAutoSync() {
  // Sync when coming online
  window.addEventListener('online', () => {
    console.log('[Sync] Back online, syncing...')
    syncTodos()
  })

  // Initial sync if online
  if (navigator.onLine) {
    syncTodos()
  }

  // Periodic sync (even when already online)
  setInterval(() => {
    if (navigator.onLine) {
      syncTodos()
    }
  }, SYNC_INTERVAL)
}

/**
 * Fetch latest tasks from Firestore
 */
export async function fetchLatestTasks(): Promise<Task[]> {
  try {
    const response = await fetch('/api/tasks')
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }
    const result = await response.json()
    return result.data || []
  } catch (error) {
    console.error('[Fetch] Error fetching tasks:', error)
    return []
  }
}
