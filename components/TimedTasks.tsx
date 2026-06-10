'use client'

import { useRef, useEffect, useState } from 'react'
import { Task } from '@/lib/db'
import { format12h } from '@/lib/time'
import TaskItem from './TaskItem'
import Icon from './Icon'

interface TimedTasksProps {
  tasks: Task[]
  onTaskMenuOpen: (task: Task, buttonElement: HTMLElement) => void
}

export default function TimedTasks({ tasks, onTaskMenuOpen }: TimedTasksProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [currentTime, setCurrentTime] = useState<string>('')

  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      const hours = String(now.getHours()).padStart(2, '0')
      const minutes = String(now.getMinutes()).padStart(2, '0')
      const timeString = `${hours}:${minutes}`
      setCurrentTime(timeString)

      const matchingTask = tasks.find(t => t.scheduledTime === timeString)
      if (matchingTask && scrollContainerRef.current) {
        const taskElement = document.getElementById(`task-${matchingTask.id}`)
        if (taskElement) {
          taskElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      }
    }

    updateTime()
    const interval = setInterval(updateTime, 60000)
    return () => clearInterval(interval)
  }, [tasks])

  const sortedTasks = [...tasks].sort((a, b) => {
    const timeA = a.scheduledTime || '99:99'
    const timeB = b.scheduledTime || '99:99'
    return timeA.localeCompare(timeB)
  })

  const taskForCurrentTime = sortedTasks.find(t => t.scheduledTime === currentTime)

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
      <div className="bg-linear-to-r from-purple-500 to-purple-600 text-white p-4 shrink-0">
        <h2 className="text-xl font-bold">Scheduled Tasks</h2>
        <p className="text-purple-100 text-sm">Current time: {format12h(currentTime)}</p>
      </div>

      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto space-y-2 p-4"
      >
        {sortedTasks.length === 0 ? (
          <div className="h-full flex items-center justify-center text-gray-400 dark:text-gray-500 text-center">
            No scheduled tasks yet
          </div>
        ) : (
          <>
            {sortedTasks.map((task) => {
              const isCurrentTime = task.scheduledTime === currentTime
              const isPast = task.scheduledTime && task.scheduledTime < currentTime

              return (
                <TaskItem
                  key={task.id}
                  task={task}
                  onTaskMenuOpen={onTaskMenuOpen}
                  footer={<>{task.repeatability}{!task.synced && ' • Pending'}</>}
                  className={`p-4 rounded-lg transition-all ${
                    isCurrentTime
                      ? 'bg-yellow-100 dark:bg-yellow-900/40 border-2 border-yellow-500 shadow-lg scale-105'
                      : isPast
                      ? 'bg-gray-50 dark:bg-gray-700/50 opacity-60'
                      : 'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600'
                  }`}
                >
                  <div className={`px-3 py-1 rounded-full text-xs font-semibold shrink-0 ${
                    isCurrentTime
                      ? 'bg-yellow-500 text-white'
                      : 'bg-purple-200 dark:bg-purple-800 text-purple-700 dark:text-purple-200'
                  }`}>
                    {format12h(task.scheduledTime) || 'No time'}
                  </div>
                </TaskItem>
              )
            })}

            {!taskForCurrentTime && sortedTasks.length > 0 && (
              <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/30 border-2 border-blue-300 dark:border-blue-700 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-blue-900 dark:text-blue-200">No task right now</p>
                    <p className="text-xs text-blue-700 dark:text-blue-300">Check one-time tasks</p>
                  </div>
                  <Icon name="arrow-right" className="w-6 h-6 text-blue-500 dark:text-blue-400" />
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
