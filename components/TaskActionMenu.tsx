'use client'

import { useRef, useLayoutEffect } from 'react'
import { Task } from '@/lib/db'
import Icon from './Icon'

interface TaskActionMenuProps {
  isOpen: boolean
  task: Task
  position: { x: number; y: number }
  onEdit: () => void
  onToggleDone: () => void
  onDelete: () => void
  onClose: () => void
}

export default function TaskActionMenu({
  isOpen,
  task,
  position,
  onEdit,
  onToggleDone,
  onDelete,
  onClose,
}: TaskActionMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    if (!isOpen || !menuRef.current) return

    const menu = menuRef.current
    const rect = menu.getBoundingClientRect()
    const menuWidth = rect.width
    const menuHeight = rect.height
    const { innerWidth, innerHeight } = window

    let left = position.x
    let top = position.y

    if (left + menuWidth > innerWidth) {
      left = position.x - menuWidth
    }
    if (top + menuHeight > innerHeight) {
      top = position.y - menuHeight
    }

    left = Math.max(4, left)
    top = Math.max(4, top)

    menu.style.top = `${top}px`
    menu.style.left = `${left}px`
  }, [isOpen, position])

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40"
        onClick={onClose}
      />

      {/* Menu */}
      <div
        ref={menuRef}
        className="fixed bg-white dark:bg-gray-800 rounded-lg shadow-xl z-50 py-2 min-w-48"
      >
        <button
          onClick={() => {
            onEdit()
            onClose()
          }}
          className="w-full px-4 py-2 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
        >
          <Icon name="edit" className="w-4 h-4 inline mr-2 align-text-bottom" />Edit
        </button>
        <button
          onClick={() => {
            onToggleDone()
            onClose()
          }}
          className="w-full px-4 py-2 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
        >
          <Icon name={task.completed ? 'undo' : 'check'} className="w-4 h-4 inline mr-2 align-text-bottom" />
          {task.completed ? 'Undo' : 'Mark Done'}
        </button>
        <hr className="my-1 border-gray-200 dark:border-gray-700" />
        <button
          onClick={() => {
            onDelete()
            onClose()
          }}
          className="w-full px-4 py-2 text-left text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 transition"
        >
          <Icon name="trash" className="w-4 h-4 inline mr-2 align-text-bottom" />Delete
        </button>
      </div>
    </>
  )
}
