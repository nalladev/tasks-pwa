'use client'

import { Task } from '@/lib/db'
import TaskItem from './TaskItem'
import Icon from './Icon'

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
      <div className="bg-linear-to-r from-green-500 to-green-600 text-white p-4 shrink-0">
        <h2 className="text-xl font-bold">One-Time Tasks</h2>
        <p className="text-green-100 text-sm">{incompleteTasks.length} pending</p>
      </div>

      {/* Tasks Container */}
      <div className="flex-1 overflow-y-auto space-y-2 p-4">
        {tasks.length === 0 ? (
          <div className="h-full flex items-center justify-center text-gray-400 text-center">
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
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  To Do ({incompleteTasks.length})
                </h3>
                <div className="space-y-2">
                  {incompleteTasks.map((task) => (
                    <TaskItem
                      key={task.id}
                      task={task}
                      onTaskMenuOpen={onTaskMenuOpen}
                      className="p-3 bg-green-50 hover:bg-green-100 rounded-lg transition-all border border-green-200"
                      footer={!task.synced ? 'Pending sync' : undefined}
                    />
                  ))}
                </div>
              </div>
            )}

            {completedTasks.length > 0 && (
              <div className="pt-4">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Completed ({completedTasks.length})
                </h3>
                <div className="space-y-2">
                  {completedTasks.map((task) => (
                    <TaskItem
                      key={task.id}
                      task={task}
                      onTaskMenuOpen={onTaskMenuOpen}
                      className="p-3 bg-gray-50 opacity-60 rounded-lg border border-gray-200"
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
