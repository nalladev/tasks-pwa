'use client'

import { useState } from 'react'
import { Task } from '@/lib/db'
import TaskItem from './TaskItem'
import Icon from './Icon'

type FilterMode = 'all' | 'indoor' | 'outdoor'

interface OneTimeTasksProps {
  tasks: Task[]
  onTaskMenuOpen: (task: Task, buttonElement: HTMLElement) => void
  onReorder: (taskId: string, direction: 'up' | 'down') => void
}

export default function OneTimeTasks({ tasks, onTaskMenuOpen, onReorder }: OneTimeTasksProps) {
  const [filter, setFilter] = useState<FilterMode>('all')

  const incompleteTasks = tasks
    .filter(t => !t.completed)
    .filter(t => filter === 'all' || t.category === filter)
    .sort((a, b) => {
      const pa = a.priority ?? 9999
      const pb = b.priority ?? 9999
      if (pa !== pb) return pa - pb
      return b.createdAt - a.createdAt
    })

  const completedTasks = tasks
    .filter(t => t.completed)
    .filter(t => filter === 'all' || t.category === filter)

  const allFiltered = tasks.filter(t => filter === 'all' || t.category === filter)

  const filterButtons: { mode: FilterMode; label: string }[] = [
    { mode: 'all', label: 'All' },
    { mode: 'indoor', label: 'Indoor' },
    { mode: 'outdoor', label: 'Outdoor' },
  ]

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-linear-to-r from-green-500 to-green-600 text-white p-4 shrink-0">
        <h2 className="text-xl font-bold">One-Time Tasks</h2>
        <p className="text-green-100 text-sm">{incompleteTasks.length} pending</p>
      </div>

      {/* Filter Buttons */}
      <div className="flex gap-1 px-4 pt-3 shrink-0">
        {filterButtons.map(({ mode, label }) => (
          <button
            key={mode}
            onClick={() => setFilter(mode)}
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
        {allFiltered.length === 0 ? (
          <div className="h-full flex items-center justify-center text-gray-400 dark:text-gray-500 text-center">
            <div>
              <Icon name="sparkles" className="w-6 h-6 mx-auto mb-1" />
              <p className="text-lg">All done!</p>
              <p className="text-sm">No one-time tasks</p>
            </div>
          </div>
        ) : (
          <>
            {incompleteTasks.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                  To Do ({incompleteTasks.length})
                </h3>
                <div className="space-y-2">
                  {incompleteTasks.map((task, index, arr) => (
                    <TaskItem
                      key={task.id}
                      task={task}
                      onTaskMenuOpen={onTaskMenuOpen}
                      className="p-3 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/40 rounded-lg transition-all border border-green-200 dark:border-green-800"
                      footer={
                        <span className="flex items-center gap-2">
                          {!task.synced && <span>Pending sync</span>}
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
                      }
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

            {completedTasks.length > 0 && (
              <div className="pt-4">
                <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                  Completed ({completedTasks.length})
                </h3>
                <div className="space-y-2">
                  {completedTasks.map((task) => (
                    <TaskItem
                      key={task.id}
                      task={task}
                      onTaskMenuOpen={onTaskMenuOpen}
                      className="p-3 bg-gray-50 dark:bg-gray-700 opacity-60 rounded-lg border border-gray-200 dark:border-gray-600"
                      footer={
                        task.category && (
                          <span className={`inline-flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                            task.category === 'indoor'
                              ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'
                              : 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300'
                          }`}>
                            {task.category}
                          </span>
                        )
                      }
                    />
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
