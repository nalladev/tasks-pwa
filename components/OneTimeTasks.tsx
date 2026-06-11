'use client'

import { useState, useMemo } from 'react'
import { Task } from '@/lib/db'
import { format12h } from '@/lib/time'
import TaskItem from './TaskItem'
import Icon from './Icon'

type FilterMode = 'all' | 'indoor' | 'outdoor' | 'completed'

interface OneTimeTasksProps {
  tasks: Task[]
  onTaskMenuOpen: (task: Task, buttonElement: HTMLElement) => void
  onReorder: (taskId: string, direction: 'up' | 'down') => void
}

function isOverdue(task: Task): boolean {
  if (!task.scheduledDate) return false
  const now = new Date()
  const today = now.toISOString().split('T')[0]

  if (task.scheduledDate < today) return true
  if (task.scheduledDate === today && task.scheduledTime) {
    const [h, m] = task.scheduledTime.split(':')
    const taskMinutes = parseInt(h) * 60 + parseInt(m)
    const nowMinutes = now.getHours() * 60 + now.getMinutes()
    return taskMinutes < nowMinutes
  }
  return false
}

function formatScheduledDate(dateStr?: string, timeStr?: string): string {
  if (!dateStr) return ''
  const now = new Date()
  const today = now.toISOString().split('T')[0]
  const tomorrow = new Date(now.getTime() + 86400000).toISOString().split('T')[0]

  let dateLabel: string
  if (dateStr === today) {
    dateLabel = 'Today'
  } else if (dateStr === tomorrow) {
    dateLabel = 'Tomorrow'
  } else {
    const d = new Date(dateStr + 'T12:00:00')
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    dateLabel = `${days[d.getDay()]}, ${months[d.getMonth()]} ${d.getDate()}`
  }

  const timeLabel = format12h(timeStr)
  return timeLabel ? `${dateLabel} at ${timeLabel}` : dateLabel
}

function sortByDateThenPriority(a: Task, b: Task) {
  if (a.scheduledDate && b.scheduledDate && a.scheduledDate !== b.scheduledDate) {
    return a.scheduledDate.localeCompare(b.scheduledDate)
  }
  if (a.scheduledDate && !b.scheduledDate) return -1
  if (!a.scheduledDate && b.scheduledDate) return 1
  const pa = a.priority ?? 9999
  const pb = b.priority ?? 9999
  if (pa !== pb) return pa - pb
  return b.createdAt - a.createdAt
}

function getStoredFilter(key: string, defaultValue: FilterMode): FilterMode {
  if (typeof window === 'undefined') return defaultValue
  const stored = localStorage.getItem(key)
  if (stored === 'all' || stored === 'indoor' || stored === 'outdoor' || stored === 'completed') return stored
  return defaultValue
}

export default function OneTimeTasks({ tasks, onTaskMenuOpen, onReorder }: OneTimeTasksProps) {
  const [filter, setFilter] = useState<FilterMode>(() => getStoredFilter('one-time-tasks-filter', 'all'))

  const isCompletedFilter = filter === 'completed'

  // Tasks shown in the current view
  const visibleTasks = useMemo(
    () => tasks
      .filter(t => isCompletedFilter ? t.completed : !t.completed)
      .filter(t => filter === 'all' || filter === 'completed' || t.category === filter),
    [tasks, filter, isCompletedFilter]
  )

  // Completed tasks for the completed view (sorted newest first)
  const completedViewTasks = useMemo(
    () => isCompletedFilter
      ? [...visibleTasks].sort((a, b) => (b.completedAt || b.createdAt) - (a.completedAt || a.createdAt))
      : [],
    [isCompletedFilter, visibleTasks]
  )

  // Grouped sections for incomplete view
  const overdueTasks = useMemo(
    () => !isCompletedFilter
      ? visibleTasks.filter(t => isOverdue(t)).sort(sortByDateThenPriority)
      : [],
    [isCompletedFilter, visibleTasks]
  )

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], [])

  const todayTasks = useMemo(
    () => !isCompletedFilter
      ? visibleTasks
          .filter(t => !isOverdue(t) && t.scheduledDate === todayStr)
          .sort(sortByDateThenPriority)
      : [],
    [isCompletedFilter, visibleTasks, todayStr]
  )

  const upcomingTasks = useMemo(
    () => !isCompletedFilter
      ? visibleTasks
          .filter(t => !isOverdue(t) && (!t.scheduledDate || t.scheduledDate > todayStr))
          .sort(sortByDateThenPriority)
      : [],
    [isCompletedFilter, visibleTasks, todayStr]
  )

  const filterButtons: { mode: FilterMode; label: string }[] = [
    { mode: 'all', label: 'All' },
    { mode: 'indoor', label: 'Indoor' },
    { mode: 'outdoor', label: 'Outdoor' },
    { mode: 'completed', label: 'Completed' },
  ]

  function renderTaskFooter(task: Task) {
    const schedule = formatScheduledDate(task.scheduledDate, task.scheduledTime)
    return (
      <span className="flex items-center gap-2 flex-wrap">
        {!task.synced && <span>Pending sync</span>}
        {task.assignedTo && (
          <span className="inline-flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300">
            <Icon name="user" className="w-3 h-3" />
            {task.assignedTo}
          </span>
        )}
        {schedule && (
          <span className={`inline-flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
            isOverdue(task)
              ? 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300'
              : 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300'
          }`}>
            <Icon name="calendar" className="w-3 h-3" />
            {schedule}
          </span>
        )}
        {task.category && (
          <span className={`inline-flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
            task.category === 'indoor'
              ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'
              : 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300'
          }`}>
            {task.category}
          </span>
        )}
      </span>
    )
  }

  const pendingCount = useMemo(
    () => tasks.filter(t => !t.completed).length,
    [tasks]
  )

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-linear-to-r from-green-500 to-green-600 text-white p-4 shrink-0">
        <h2 className="text-xl font-bold">One-Time Tasks</h2>
        <p className="text-green-100 text-sm">
          {isCompletedFilter
            ? `${completedViewTasks.length} completed`
            : `${pendingCount} pending`}
        </p>
      </div>

      {/* Filter Buttons */}
      <div className="flex gap-1 px-4 pt-3 shrink-0">
        {filterButtons.map(({ mode, label }) => (
          <button
            key={mode}
            onClick={() => {
              setFilter(mode)
              localStorage.setItem('one-time-tasks-filter', mode)
            }}
            className={`px-3 py-1 text-xs font-medium rounded-full transition ${
              filter === mode
                ? 'bg-green-500 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Tasks Container */}
      <div className="flex-1 overflow-y-auto space-y-2 p-4">
        {visibleTasks.length === 0 ? (
          <div className="h-full flex items-center justify-center text-gray-400 dark:text-gray-500 text-center">
            <div>
              <Icon name="sparkles" className="w-6 h-6 mx-auto mb-1" />
              <p className="text-lg">
                {isCompletedFilter ? 'No completed tasks' : 'All done!'}
              </p>
              <p className="text-sm">
                {isCompletedFilter ? 'Complete a task to see it here' : 'No one-time tasks'}
              </p>
            </div>
          </div>
        ) : isCompletedFilter ? (
          /* Completed list (no reorder) */
          <div className="space-y-2">
            {completedViewTasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                onTaskMenuOpen={onTaskMenuOpen}
                className="p-3 bg-gray-50 dark:bg-gray-700 opacity-60 rounded-lg border border-gray-200 dark:border-gray-600"
                footer={renderTaskFooter(task)}
              />
            ))}
          </div>
        ) : (
          /* Incomplete grouped view */
          <>
            {overdueTasks.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-red-500 dark:text-red-400 uppercase tracking-wide mb-2 flex items-center gap-1">
                  <Icon name="alert" className="w-3 h-3" />
                  Overdue ({overdueTasks.length})
                </h3>
                <div className="space-y-2">
                  {overdueTasks.map((task, index, arr) => (
                    <TaskItem
                      key={task.id}
                      task={task}
                      onTaskMenuOpen={onTaskMenuOpen}
                      className="p-3 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-lg transition-all border border-red-200 dark:border-red-800"
                      footer={renderTaskFooter(task)}
                    >
                      {/* Reorder buttons & priority badge */}
                      <div className="flex items-center shrink-0 mr-1">
                        <div className="flex flex-col gap-0.5 mr-1">
                          <button
                            onClick={(e) => { e.stopPropagation(); onReorder(task.id, 'up') }}
                            disabled={index === 0}
                            className="text-gray-400 dark:text-gray-500 hover:text-green-600 dark:hover:text-green-400 disabled:opacity-20 disabled:cursor-not-allowed leading-none p-0"
                            title="Move up"
                          >
                            <Icon name="chevron-up" className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); onReorder(task.id, 'down') }}
                            disabled={index === arr.length - 1}
                            className="text-gray-400 dark:text-gray-500 hover:text-green-600 dark:hover:text-green-400 disabled:opacity-20 disabled:cursor-not-allowed leading-none p-0"
                            title="Move down"
                          >
                            <Icon name="chevron-down" className="w-4 h-4" />
                          </button>
                        </div>
                        <span className="text-[10px] font-mono text-gray-400 dark:text-gray-500 w-4 text-center shrink-0">
                          {task.priority ?? index + 1}
                        </span>
                      </div>
                    </TaskItem>
                  ))}
                </div>
              </div>
            )}

            {todayTasks.length > 0 && (
              <div className={overdueTasks.length > 0 ? 'pt-4' : ''}>
                <h3 className="text-xs font-semibold text-green-600 dark:text-green-400 uppercase tracking-wide mb-2">
                  Today ({todayTasks.length})
                </h3>
                <div className="space-y-2">
                  {todayTasks.map((task, index, arr) => (
                    <TaskItem
                      key={task.id}
                      task={task}
                      onTaskMenuOpen={onTaskMenuOpen}
                      className="p-3 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/40 rounded-lg transition-all border border-green-200 dark:border-green-800"
                      footer={renderTaskFooter(task)}
                    >
                      {/* Reorder buttons & priority badge */}
                      <div className="flex items-center shrink-0 mr-1">
                        <div className="flex flex-col gap-0.5 mr-1">
                          <button
                            onClick={(e) => { e.stopPropagation(); onReorder(task.id, 'up') }}
                            disabled={index === 0}
                            className="text-gray-400 dark:text-gray-500 hover:text-green-600 dark:hover:text-green-400 disabled:opacity-20 disabled:cursor-not-allowed leading-none p-0"
                            title="Move up"
                          >
                            <Icon name="chevron-up" className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); onReorder(task.id, 'down') }}
                            disabled={index === arr.length - 1}
                            className="text-gray-400 dark:text-gray-500 hover:text-green-600 dark:hover:text-green-400 disabled:opacity-20 disabled:cursor-not-allowed leading-none p-0"
                            title="Move down"
                          >
                            <Icon name="chevron-down" className="w-4 h-4" />
                          </button>
                        </div>
                        <span className="text-[10px] font-mono text-gray-400 dark:text-gray-500 w-4 text-center shrink-0">
                          {task.priority ?? index + 1}
                        </span>
                      </div>
                    </TaskItem>
                  ))}
                </div>
              </div>
            )}

            {upcomingTasks.length > 0 && (
              <div className={(overdueTasks.length > 0 || todayTasks.length > 0) ? 'pt-4' : ''}>
                <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                  Upcoming ({upcomingTasks.length})
                </h3>
                <div className="space-y-2">
                  {upcomingTasks.map((task, index, arr) => (
                    <TaskItem
                      key={task.id}
                      task={task}
                      onTaskMenuOpen={onTaskMenuOpen}
                      className="p-3 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/40 rounded-lg transition-all border border-green-200 dark:border-green-800"
                      footer={renderTaskFooter(task)}
                    >
                      {/* Reorder buttons & priority badge */}
                      <div className="flex items-center shrink-0 mr-1">
                        <div className="flex flex-col gap-0.5 mr-1">
                          <button
                            onClick={(e) => { e.stopPropagation(); onReorder(task.id, 'up') }}
                            disabled={index === 0}
                            className="text-gray-400 dark:text-gray-500 hover:text-green-600 dark:hover:text-green-400 disabled:opacity-20 disabled:cursor-not-allowed leading-none p-0"
                            title="Move up"
                          >
                            <Icon name="chevron-up" className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); onReorder(task.id, 'down') }}
                            disabled={index === arr.length - 1}
                            className="text-gray-400 dark:text-gray-500 hover:text-green-600 dark:hover:text-green-400 disabled:opacity-20 disabled:cursor-not-allowed leading-none p-0"
                            title="Move down"
                          >
                            <Icon name="chevron-down" className="w-4 h-4" />
                          </button>
                        </div>
                        <span className="text-[10px] font-mono text-gray-400 dark:text-gray-500 w-4 text-center shrink-0">
                          {task.priority ?? index + 1}
                        </span>
                      </div>
                    </TaskItem>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
