import { openDB, IDBPDatabase } from 'idb'

export type TaskRepeatability = 'never' | 'daily' | 'weekly' | 'monthly'

export type TaskCategory = 'indoor' | 'outdoor'

export type SyncStatus = 'synced' | 'pending' | 'failed'

// Backward compatibility
export type Todo = Task

export interface Task {
  id: string
  text: string
  completed: boolean
  createdAt: number
  repeatability: TaskRepeatability
  scheduledTime?: string
  scheduledDate?: string // ISO date string (YYYY-MM-DD) for one-time tasks
  category?: TaskCategory
  priority?: number
  assignedTo?: string // Who the task is assigned to/completed it
  completedAt?: number // When the task was completed
  // Sync metadata
  synced: SyncStatus
  lastSyncAt?: number
  lastModifiedAt: number
  deletedAt?: number // For soft deletes
  userId?: string // For multi-user support later
}

let dbInstance: IDBPDatabase | null = null

export async function getDB() {
  if (dbInstance) return dbInstance
  dbInstance = await openDB('tasks-pwa-db', 2, {
    upgrade(db) {
      // Create or update tasks store
      if (!db.objectStoreNames.contains('tasks')) {
        const taskStore = db.createObjectStore('tasks', { keyPath: 'id' })
        taskStore.createIndex('by-synced', 'synced')
        taskStore.createIndex('by-repeatability', 'repeatability')
        taskStore.createIndex('by-lastModifiedAt', 'lastModifiedAt')
      }

      // Create sync queue store (for offline changes)
      if (!db.objectStoreNames.contains('sync-queue')) {
        db.createObjectStore('sync-queue', { keyPath: 'id', autoIncrement: true })
      }
    },
  })
  return dbInstance
}

/**
 * Add a task locally
 */
export async function addTask(
  text: string,
  repeatability: TaskRepeatability = 'never',
  scheduledTime?: string,
  category?: TaskCategory,
  priority?: number,
  scheduledDate?: string,
  assignedTo?: string
): Promise<Task> {
  const db = await getDB()
  const now = Date.now()
  const task: Task = {
    id: crypto.randomUUID(),
    text,
    completed: false,
    createdAt: now,
    lastModifiedAt: now,
    repeatability,
    scheduledTime,
    scheduledDate,
    category,
    priority,
    assignedTo,
    synced: 'pending',
  }
  await db.add('tasks', task)
  return task
}

// Backward compatibility
export async function addTodo(text: string): Promise<Task> {
  return addTask(text, 'never', undefined, undefined, undefined)
}

/**
 * Get all tasks
 */
export async function getTasks(): Promise<Task[]> {
  const db = await getDB()
  const tasks = await db.getAll('tasks')
  // Filter out soft-deleted tasks
  return tasks.filter(t => !t.deletedAt)
}

/**
 * Get timed (repeating) tasks
 */
export async function getTimedTasks(): Promise<Task[]> {
  const db = await getDB()
  const allTasks = await db.getAll('tasks')
  return allTasks.filter(t => t.repeatability !== 'never' && !t.deletedAt)
}

/**
 * Get one-time tasks
 */
export async function getOneTimeTasks(): Promise<Task[]> {
  const db = await getDB()
  const allTasks = await db.getAll('tasks')
  return allTasks.filter(t => t.repeatability === 'never' && !t.deletedAt)
}

/**
 * Get soft-deleted tasks (for recycle bin)
 */
export async function getDeletedTasks(): Promise<Task[]> {
  const db = await getDB()
  const allTasks = await db.getAll('tasks')
  return allTasks.filter(t => t.deletedAt).sort((a, b) => (b.deletedAt || 0) - (a.deletedAt || 0))
}

/**
 * Restore a soft-deleted task
 */
export async function restoreTask(id: string): Promise<void> {
  const db = await getDB()
  const task = await db.get('tasks', id)
  if (!task) return

  const restored: Task = {
    ...task,
    deletedAt: undefined,
    lastModifiedAt: Date.now(),
    synced: 'pending',
  }
  await db.put('tasks', restored)
}

/**
 * Get completed tasks (for leaderboard/analytics)
 */
export async function getCompletedTasks(): Promise<Task[]> {
  const db = await getDB()
  const allTasks = await db.getAll('tasks')
  return allTasks.filter(t => t.completed && !t.deletedAt)
}

/**
 * Get a single task
 */
export async function getTask(id: string): Promise<Task | undefined> {
  const db = await getDB()
  return db.get('tasks', id)
}

/**
 * Update a task
 */
export async function updateTodo(id: string, updates: Partial<Task>): Promise<void> {
  const db = await getDB()
  const task = await db.get('tasks', id)
  if (!task) return

  const updated: Task = {
    ...task,
    ...updates,
    lastModifiedAt: Date.now(),
    synced: 'pending', // Mark as pending sync
  }
  await db.put('tasks', updated)
}

/**
 * Soft delete a task (mark as deleted but keep in DB for sync)
 */
export async function deleteTodo(id: string): Promise<void> {
  const db = await getDB()
  const task = await db.get('tasks', id)
  if (!task) return

  const deleted: Task = {
    ...task,
    deletedAt: Date.now(),
    lastModifiedAt: Date.now(),
    synced: 'pending',
  }
  await db.put('tasks', deleted)
}

/**
 * Update a task's priority (for reordering)
 */
export async function updateTaskPriority(id: string, priority: number): Promise<void> {
  const db = await getDB()
  const task = await db.get('tasks', id)
  if (!task) return

  const updated: Task = {
    ...task,
    priority,
    lastModifiedAt: Date.now(),
    synced: 'pending',
  }
  await db.put('tasks', updated)
}

/**
 * Hard delete (only use for cleanup after successful sync)
 */
export async function hardDeleteTodo(id: string): Promise<void> {
  const db = await getDB()
  await db.delete('tasks', id)
}

/**
 * Get all pending changes for sync
 */
export async function getPendingTasks(): Promise<Task[]> {
  const db = await getDB()
  const allTasks = await db.getAll('tasks')
  return allTasks.filter(t => t.synced === 'pending')
}

/**
 * Get failed tasks
 */
export async function getFailedTasks(): Promise<Task[]> {
  const db = await getDB()
  const allTasks = await db.getAll('tasks')
  return allTasks.filter(t => t.synced === 'failed')
}

/**
 * Mark task as synced
 */
export async function markAsSynced(id: string, lastSyncAt?: number): Promise<void> {
  const db = await getDB()
  const task = await db.get('tasks', id)
  if (!task) return

  task.synced = 'synced'
  task.lastSyncAt = lastSyncAt || Date.now()
  await db.put('tasks', task)
}

/**
 * Mark task as failed
 */
export async function markAsFailed(id: string): Promise<void> {
  const db = await getDB()
  const task = await db.get('tasks', id)
  if (!task) return

  task.synced = 'failed'
  await db.put('tasks', task)
}

/**
 * Add to sync queue
 */
export async function addToSyncQueue(taskId: string, operation: 'create' | 'update' | 'delete'): Promise<void> {
  const db = await getDB()
  const syncStore = db.transaction('sync-queue', 'readwrite').objectStore('sync-queue')
  await syncStore.add({
    taskId,
    operation,
    timestamp: Date.now(),
  })
}

interface SyncQueueEntry {
  id?: number
  taskId: string
  operation: 'create' | 'update' | 'delete'
  timestamp: number
}

/**
 * Get sync queue
 */
export async function getSyncQueue(): Promise<SyncQueueEntry[]> {
  const db = await getDB()
  return db.getAll('sync-queue')
}

/**
 * Clear sync queue
 */
export async function clearSyncQueue(): Promise<void> {
  const db = await getDB()
  const syncStore = db.transaction('sync-queue', 'readwrite').objectStore('sync-queue')
  await syncStore.clear()
}

// Backward compatibility
export async function getTodos(): Promise<Task[]> {
  return getTasks()
}

export async function getUnsyncedTodos(): Promise<Task[]> {
  return getPendingTasks()
}
