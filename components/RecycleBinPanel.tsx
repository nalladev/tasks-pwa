'use client'

import { useState, useEffect, useCallback } from 'react'
import { getDeletedTasks, restoreTask, hardDeleteTodo, Task } from '@/lib/db'
import { syncTodos } from '@/lib/sync'
import FullPageOverlay from './FullPageOverlay'
import Icon from './Icon'

function formatDeletedTime(timestamp: number): string {
  const date = new Date(timestamp)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const day = date.getDate()
  const month = months[date.getMonth()]
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  return `${month} ${day} at ${hours}:${minutes}`
}

function TaskCard({
  task,
  onRestore,
  onDeleteForever,
  isProcessing,
}: {
  task: Task
  onRestore: () => void
  onDeleteForever: () => void
  isProcessing: boolean
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-red-200 dark:border-red-900/50 overflow-hidden transition-all hover:shadow-xl">
      <div className="p-4">
        {/* Task text */}
        <p className="text-gray-900 dark:text-gray-100 font-medium text-base mb-2 line-clamp-2">
          {task.text}
        </p>

        {/* Meta info */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Category badge */}
          {task.category && (
            <span className={`inline-flex items-center gap-0.5 font-medium px-2 py-0.5 rounded-full ${
              task.category === 'indoor'
                ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'
                : 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300'
            }`}>
              {task.category}
            </span>
          )}

          {/* Repeatability badge */}
          <span className="inline-flex items-center gap-0.5 font-medium px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
            {task.repeatability === 'never' ? 'One-time' : task.repeatability}
          </span>

          {/* Deleted time */}
          <span className="text-gray-400 dark:text-gray-500 ml-auto">
            Deleted {task.deletedAt ? formatDeletedTime(task.deletedAt) : ''}
          </span>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex border-t border-gray-100 dark:border-gray-700 divide-x divide-gray-100 dark:divide-gray-700">
        <button
          onClick={onRestore}
          disabled={isProcessing}
          className="flex-1 flex items-center justify-center gap-1.5 py-3 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition disabled:opacity-50"
        >
          <Icon name="undo" className="w-4 h-4" />
          Restore
        </button>
        <button
          onClick={onDeleteForever}
          disabled={isProcessing}
          className="flex-1 flex items-center justify-center gap-1.5 py-3 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition disabled:opacity-50"
        >
          <Icon name="trash" className="w-4 h-4" />
          Delete Forever
        </button>
      </div>
    </div>
  )
}

interface RecycleBinPanelProps {
  isOpen: boolean
  onClose: () => void
}

export default function RecycleBinPanel({ isOpen, onClose }: RecycleBinPanelProps) {
  const [deletedTasks, setDeletedTasks] = useState<Task[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set())

  const loadDeletedTasks = useCallback(async () => {
    setIsLoading(true)
    const tasks = await getDeletedTasks()
    setDeletedTasks(tasks)
    setIsLoading(false)
  }, [])

  useEffect(() => {
    if (isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      loadDeletedTasks()
    }
  }, [isOpen, loadDeletedTasks])

  async function handleRestore(id: string) {
    setProcessingIds(prev => new Set(prev).add(id))
    try {
      await restoreTask(id)
      await syncTodos()
      await loadDeletedTasks()
    } catch (error) {
      console.error('Failed to restore task:', error)
    } finally {
      setProcessingIds(prev => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    }
  }

  async function handleDeleteForever(id: string) {
    setProcessingIds(prev => new Set(prev).add(id))
    try {
      // Remove from IndexedDB first (works offline)
      await hardDeleteTodo(id)

      // Try to delete from Firestore (may fail silently if offline).
      // This uses the delete-forever endpoint which also records a
      // deletion tombstone so other devices can sync the removal.
      try {
        await fetch('/api/tasks/delete-forever', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id }),
        })
      } catch {
        console.log('[RecycleBin] Offline: task removed locally only')
      }

      await loadDeletedTasks()
    } catch (error) {
      console.error('Failed to permanently delete task:', error)
    } finally {
      setProcessingIds(prev => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    }
  }

  return (
    <FullPageOverlay
      isOpen={isOpen}
      onClose={onClose}
      title={
        <span className="flex items-center gap-2">
          <Icon name="trash" className="w-6 h-6 text-red-500" />
          Recycle Bin
        </span>
      }
      subtitle={
        deletedTasks.length === 0
          ? 'No deleted tasks'
          : `${deletedTasks.length} task${deletedTasks.length === 1 ? '' : 's'} awaiting action`
      }
    >
      <div className="p-4 md:p-6">
        {/* Loading state */}
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <div className="text-gray-600 dark:text-gray-400">Loading...</div>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && deletedTasks.length === 0 && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center text-gray-400 dark:text-gray-500">
              <Icon name="sparkles" className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-lg font-medium">Nothing here</p>
              <p className="text-sm mt-1">Deleted tasks will appear here</p>
            </div>
          </div>
        )}

        {/* Task list */}
        {!isLoading && deletedTasks.length > 0 && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto w-full">
            {deletedTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                isProcessing={processingIds.has(task.id)}
                onRestore={() => handleRestore(task.id)}
                onDeleteForever={() => handleDeleteForever(task.id)}
              />
            ))}
          </div>
        )}
      </div>
    </FullPageOverlay>
  )
}
