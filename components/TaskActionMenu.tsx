'use client'

import { Task } from '@/lib/db'

interface TaskActionMenuProps {
  isOpen: boolean
  task: Task
  onEdit: () => void
  onToggleDone: () => void
  onDelete: () => void
  onClose: () => void
}

export default function TaskActionMenu({
  isOpen,
  task,
  onEdit,
  onToggleDone,
  onDelete,
  onClose,
}: TaskActionMenuProps) {
  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40"
        onClick={onClose}
      />

      {/* Menu */}
      <div className="fixed bg-white rounded-lg shadow-xl z-50 py-2 min-w-48">
        <button
          onClick={() => {
            onEdit()
            onClose()
          }}
          className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100 transition"
        >
          ✏️ Edit
        </button>
        <button
          onClick={() => {
            onToggleDone()
            onClose()
          }}
          className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100 transition"
        >
          {task.completed ? '↩️ Undo' : '✓ Mark Done'}
        </button>
        <hr className="my-1" />
        <button
          onClick={() => {
            onDelete()
            onClose()
          }}
          className="w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 transition"
        >
          🗑️ Delete
        </button>
      </div>
    </>
  )
}
