import { openDB, IDBPDatabase } from 'idb'

export type TaskRepeatability = 'never' | 'daily' | 'weekly' | 'monthly'

export interface Task {
  id: string
  text: string
  completed: boolean
  createdAt: number
  synced: boolean
  // Repeatability
  repeatability: TaskRepeatability
  // Time-based scheduling (only for repeating tasks)
  scheduledTime?: string // HH:MM format, e.g., "14:30"
  // One-time tasks don't have scheduledTime or repeatability='never'
}

// Kept for backward compatibility
export type Todo = Task

let dbInstance: IDBPDatabase | null = null

export async function getDB() {
  if (dbInstance) return dbInstance
  dbInstance = await openDB('todo-db', 1, {
    upgrade(db) {
      const todoStore = db.createObjectStore('todos', { keyPath: 'id' })
      todoStore.createIndex('by-synced', 'synced')
      todoStore.createIndex('by-repeatability', 'repeatability')
    },
  })
  return dbInstance
}

export async function addTask(text: string, repeatability: TaskRepeatability = 'never', scheduledTime?: string): Promise<Task> {
  const db = await getDB()
  const task: Task = {
    id: crypto.randomUUID(),
    text,
    completed: false,
    createdAt: Date.now(),
    synced: false,
    repeatability,
    scheduledTime,
  }
  await db.add('todos', task)
  return task
}

// Backward compatibility
export async function addTodo(text: string): Promise<Todo> {
  return addTask(text, 'never')
}

export async function getTodos(): Promise<Task[]> {
  const db = await getDB()
  return db.getAll('todos')
}

export async function getTimedTasks(): Promise<Task[]> {
  const db = await getDB()
  const allTasks = await db.getAll('todos')
  return allTasks.filter(t => t.repeatability !== 'never')
}

export async function getOneTimeTasks(): Promise<Task[]> {
  const db = await getDB()
  const allTasks = await db.getAll('todos')
  return allTasks.filter(t => t.repeatability === 'never')
}

export async function updateTodo(id: string, updates: Partial<Task>): Promise<void> {
  const db = await getDB()
  const todo = await db.get('todos', id)
  if (!todo) return
  const updated = { ...todo, ...updates, synced: false }
  await db.put('todos', updated)
}

export async function deleteTodo(id: string): Promise<void> {
  const db = await getDB()
  await db.delete('todos', id)
}

export async function getUnsyncedTodos(): Promise<Task[]> {
  const db = await getDB()
  const allTodos = await db.getAll('todos')
  return allTodos.filter((todo: Todo) => !todo.synced)
}

export async function markAsSynced(id: string): Promise<void> {
  const db = await getDB()
  const todo = await db.get('todos', id)
  if (!todo) return
  todo.synced = true
  await db.put('todos', todo)
}
