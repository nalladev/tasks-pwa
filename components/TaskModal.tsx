'use client'

import { useState } from 'react'
import { Task, TaskRepeatability } from '@/lib/db'

interface TaskModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (text: string, repeatability: TaskRepeatability, scheduledTime?: string) => void
  task?: Task
}

export default function TaskModal({ isOpen, onClose, onSave, task }: TaskModalProps) {
  const [text, setText] = useState(task?.text || '')
  const [repeatability, setRepeatability] = useState<TaskRepeatability>(task?.repeatability || 'never')
  const [scheduledTime, setScheduledTime] = useState(task?.scheduledTime || '')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!text.trim()) return
    onSave(text.trim(), repeatability, repeatability !== 'never' ? scheduledTime : undefined)
    setText('')
    setRepeatability('never')
    setScheduledTime('')
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          {task ? 'Edit Task' : 'New Task'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Task Text */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Task Description
            </label>
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="What needs to be done?"
              autoFocus
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Repeatability */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Repeat
            </label>
            <div className="space-y-2">
              {(['never', 'daily', 'weekly', 'monthly'] as TaskRepeatability[]).map((option) => (
                <label key={option} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="repeatability"
                    value={option}
                    checked={repeatability === option}
                    onChange={(e) => setRepeatability(e.target.value as TaskRepeatability)}
                    className="w-4 h-4 text-blue-500 focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-gray-700 capitalize">
                    {option === 'never' ? 'One-time' : option}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Scheduled Time */}
          {repeatability !== 'never' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Time of Day (Optional)
              </label>
              <input
                type="time"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Leave blank to show anytime during the day
              </p>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition font-medium"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
