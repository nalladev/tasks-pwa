'use client'

import { useRef, useEffect, useState } from 'react'
import { Task } from '@/lib/db'

interface TimedTasksProps {
  tasks: Task[]
  onTaskMenuOpen: (task: Task, buttonElement: HTMLElement) => void
}

export default function TimedTasks({ tasks, onTaskMenuOpen }: TimedTasksProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [currentTime, setCurrentTime] = useState<string>('')

  // Update current time and scroll to matching task
  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      const hours = String(now.getHours()).padStart(2, '0')
      const minutes = String(now.getMinutes()).padStart(2, '0')
      const timeString = `${hours}:${minutes}`
      setCurrentTime(timeString)

      // Find and scroll to task that matches current time
      const matchingTask = tasks.find(t => t.scheduledTime === timeString)
      if (matchingTask && scrollContainerRef.current) {
        const taskElement = document.getElementById(`task-${matchingTask.id}`)
        if (taskElement) {
          taskElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      }
    }

    updateTime()
    const interval = setInterval(updateTime, 60000) // Update every minute
    return () => clearInterval(interval)
  }, [tasks])

  // Sort tasks by scheduled time
  const sortedTasks = [...tasks].sort((a, b) => {
    const timeA = a.scheduledTime || '99:99'
    const timeB = b.scheduledTime || '99:99'
    return timeA.localeCompare(timeB)
  })

  // Check if there's a task scheduled for current time
  const taskForCurrentTime = sortedTasks.find(t => t.scheduledTime === currentTime)

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-4 flex-shrink-0">
        <h2 className="text-xl font-bold">Scheduled Tasks</h2>
        <p className="text-purple-100 text-sm">Current time: {currentTime}</p>
      </div>

      {/* Tasks Container */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto space-y-2 p-4"
      >
        {sortedTasks.length === 0 ? (
          <div className="h-full flex items-center justify-center text-gray-400 text-center">
            No scheduled tasks yet
          </div>
        ) : (
          <>
            {sortedTasks.map((task, index) => {
              const isCurrentTime = task.scheduledTime === currentTime
              const isPast = task.scheduledTime && task.scheduledTime < currentTime

              return (
                <div
                  key={task.id}
                  id={`task-${task.id}`}
                  className={`p-4 rounded-lg transition-all ${
                    isCurrentTime
                      ? 'bg-yellow-100 border-2 border-yellow-500 shadow-lg scale-105'
                      : isPast
                      ? 'bg-gray-50 opacity-60'
                      : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Time Badge */}
                    <div className={`px-3 py-1 rounded-full text-xs font-semibold flex-shrink-0 ${
                      isCurrentTime
                        ? 'bg-yellow-500 text-white'
                        : 'bg-purple-200 text-purple-700'
                    }`}>
                      {task.scheduledTime || 'No time'}
                    </div>

                    {/* Task Content */}
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-sm font-medium break-words ${
                          task.completed
                            ? 'line-through text-gray-400'
                            : 'text-gray-800'
                        }`}
                      >
                        {task.text}
                      </p>
                      <p className="text-xs text-gray-500 mt-1 capitalize">
                        {task.repeatability}
                        {task.synced ? '' : ' • Pending'}
                      </p>
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
              )
            })}

            {/* Show "Do one-time tasks" pointer if no current task */}
            {!taskForCurrentTime && sortedTasks.length > 0 && (
              <div className="mt-6 p-4 bg-blue-50 border-2 border-blue-300 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-blue-900">No task right now</p>
                    <p className="text-xs text-blue-700">Check one-time tasks →</p>
                  </div>
                  <div className="text-2xl">→</div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
