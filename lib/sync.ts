'use client'

import { getPendingTasks, markAsSynced, markAsFailed, getDB, Task } from './db'

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

/**
 * Pull tasks from server and merge into local IndexedDB.
 * Server tasks that don't exist locally are added.
 * For tasks that exist and are synced on both sides, the newer one wins.
 * Local pending/failed tasks are kept (un-pushed changes take precedence).
 */
export async function pullFromServer(): Promise<boolean> {
  try {
    const serverTasks = await fetchLatestTasks()
    if (serverTasks.length === 0) return false

    let changed = false
    const db = await getDB()
    const tx = db.transaction('tasks', 'readwrite')

    for (const serverTask of serverTasks) {
      const existing = await tx.store.get(serverTask.id)

      if (!existing) {
        if (serverTask.deletedAt) continue
        await tx.store.put({ ...serverTask, synced: 'synced' })
        changed = true
      } else if (existing.synced === 'synced') {
        if (serverTask.lastModifiedAt > existing.lastModifiedAt) {
          if (serverTask.deletedAt) {
            await tx.store.put({ ...existing, deletedAt: serverTask.deletedAt, synced: 'synced' })
          } else {
            await tx.store.put({ ...serverTask, synced: 'synced' })
          }
          changed = true
        }
      }
    }

    await tx.done
    if (changed) console.log('[Pull] Merge complete')
    return changed
  } catch (error) {
    console.error('[Pull] Error pulling tasks from server:', error)
    return false
  }
}
