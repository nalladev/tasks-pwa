'use client'

import { useState } from 'react'
import { Task, TaskRepeatability, TaskCategory } from '@/lib/db'
import { parseScheduledTime, to24h } from '@/lib/time'

interface TaskModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (text: string, repeatability: TaskRepeatability, scheduledTime?: string, category?: TaskCategory) => void
  task?: Task
}

export default function TaskModal({ isOpen, onClose, onSave, task }: TaskModalProps) {
  const initial = parseScheduledTime(task?.scheduledTime || '')
  const [text, setText] = useState(task?.text || '')
  const [repeatability, setRepeatability] = useState<TaskRepeatability>(task?.repeatability || 'never')
  const [category, setCategory] = useState<TaskCategory | undefined>(task?.category)
  const [hour12, setHour12] = useState(initial.hour12)
  const [minute, setMinute] = useState(initial.minute)
  const [period, setPeriod] = useState<'AM' | 'PM'>(initial.period)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!text.trim()) return
    const scheduledTime = repeatability !== 'never' ? to24h(hour12, minute, period) : undefined
    onSave(text.trim(), repeatability, scheduledTime, category)
    setText('')
    setRepeatability('never')
    setCategory(undefined)
    const reset = parseScheduledTime('')
    setHour12(reset.hour12)
    setMinute(reset.minute)
    setPeriod(reset.period)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">
          {task ? 'Edit Task' : 'New Task'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Task Text */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Task Description
            </label>
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="What needs to be done?"
              autoFocus
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black dark:text-white bg-white dark:bg-gray-700 placeholder-gray-400 dark:placeholder-gray-500"
            />
          </div>

          {/* Repeatability */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
                  <span className="text-gray-700 dark:text-gray-300 capitalize">
                    {option === 'never' ? 'One-time' : option}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Scheduled Time */}
          {repeatability !== 'never' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Time of Day (Optional)
              </label>
              <div className="flex gap-2">
                <select
                  value={hour12}
                  onChange={(e) => setHour12(Number(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black dark:text-white bg-white dark:bg-gray-700"
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
                <span className="text-gray-500 dark:text-gray-400 self-center">:</span>
                <select
                  value={minute}
                  onChange={(e) => setMinute(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black dark:text-white bg-white dark:bg-gray-700"
                >
                  {Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0')).map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
                <select
                  value={period}
                  onChange={(e) => setPeriod(e.target.value as 'AM' | 'PM')}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black dark:text-white bg-white dark:bg-gray-700"
                >
                  <option value="AM">AM</option>
                  <option value="PM">PM</option>
                </select>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Leave as default to show anytime during the day
              </p>
            </div>
          )}

          {/* Category: Indoor / Outdoor */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Category
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="category"
                  value=""
                  checked={category === undefined}
                  onChange={() => setCategory(undefined)}
                  className="w-4 h-4 text-blue-500 focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-gray-700 dark:text-gray-300">None</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="category"
                  value="indoor"
                  checked={category === 'indoor'}
                  onChange={() => setCategory('indoor')}
                  className="w-4 h-4 text-blue-500 focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-gray-700 dark:text-gray-300">Indoor</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="category"
                  value="outdoor"
                  checked={category === 'outdoor'}
                  onChange={() => setCategory('outdoor')}
                  className="w-4 h-4 text-blue-500 focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-gray-700 dark:text-gray-300">Outdoor</span>
              </label>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition font-medium"
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
