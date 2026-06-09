'use client'

import { Task } from '@/lib/db'

interface OneTimeTasksProps {
  tasks: Task[]
  onTaskMenuOpen: (task: Task, buttonElement: HTMLElement) => void
}

export default function OneTimeTasks({ tasks, onTaskMenuOpen }: OneTimeTasksProps) {
  const incompleteTasks = tasks.filter(t => !t.completed)
  const completedTasks = tasks.filter(t => t.completed)

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-4 flex-shrink-0">
        <h2 className="text-xl font-bold">One-Time Tasks</h2>
        <p className="text-green-100 text-sm">{incompleteTasks.length} pending</p>
      </div>

      {/* Tasks Container */}
      <div className="flex-1 overflow-y-auto space-y-2 p-4">
        {tasks.length === 0 ? (
          <div className="h-full flex items-center justify-center text-gray-400 text-center">
            <div>
              <p className="text-lg">✨ All done!</p>
              <p className="text-sm">No one-time tasks</p>
            </div>
          </div>
        ) : (
          <>
            {/* Incomplete Tasks */}
            {incompleteTasks.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  To Do ({incompleteTasks.length})
                </h3>
                <div className="space-y-2">
                  {incompleteTasks.map((task) => (
                    <div
                      key={task.id}
                      className="p-3 bg-green-50 hover:bg-green-100 rounded-lg transition-all border border-green-200"
                    >
                      <div className="flex items-start gap-3">
                        {/* Checkbox Indicator */}
                        <div className="flex-shrink-0 mt-0.5">
                          <div className="w-4 h-4 border-2 border-green-500 rounded-sm"></div>
                        </div>

                        {/* Task Content */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 break-words">
                            {task.text}
                          </p>
                          {!task.synced && (
                            <p className="text-xs text-gray-500 mt-1">Pending sync</p>
                          )}
                        </div>

                        {/* Action Button */}
                        <button
                          onClick={(e) => onTaskMenuOpen(task, e.currentTarget)}
                          className="flex-shrink-0 text-gray-400 hover:text-gray-600 p-1"
                          title="Task options"
                        >
                          ⋮
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Completed Tasks */}
            {completedTasks.length > 0 && (
              <div className="pt-4">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Completed ({completedTasks.length})
                </h3>
                <div className="space-y-2">
                  {completedTasks.map((task) => (
                    <div
                      key={task.id}
                      className="p-3 bg-gray-50 opacity-60 rounded-lg border border-gray-200"
                    >
                      <div className="flex items-start gap-3">
                        {/* Checkbox Indicator */}
                        <div className="flex-shrink-0 mt-0.5">
                          <div className="w-4 h-4 bg-green-500 rounded-sm flex items-center justify-center">
                            <span className="text-white text-xs">✓</span>
                          </div>
                        </div>

                        {/* Task Content */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-500 break-words line-through">
                            {task.text}
                          </p>
                        </div>

                        {/* Action Button */}
                        <button
                          onClick={(e) => onTaskMenuOpen(task, e.currentTarget)}
                          className="flex-shrink-0 text-gray-300 hover:text-gray-400 p-1"
                          title="Task options"
                        >
                          ⋮
                        </button>
                      </div>
                    </div>
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
