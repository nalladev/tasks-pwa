'use client'

import { ReactNode } from 'react'
import { Task } from '@/lib/db'
import Icon from './Icon'

interface TaskItemProps {
  task: Task
  onTaskMenuOpen: (task: Task, buttonElement: HTMLElement) => void
  className?: string
  footer?: ReactNode
  children?: ReactNode
}

export default function TaskItem({ task, onTaskMenuOpen, className, footer, children }: TaskItemProps) {
  return (
    <div className={className}>
      <div className="flex items-center gap-3">
        {children}

        <div className="flex-1 min-w-0">
          <p
            className={`text-sm font-medium wrap-break-word ${
              task.completed ? 'line-through text-gray-400 dark:text-gray-500' : 'text-gray-800 dark:text-gray-200'
            }`}
          >
            {task.text}
          </p>
          {footer && (
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 capitalize">{footer}</div>
          )}
        </div>

        <button
          onClick={(e) => onTaskMenuOpen(task, e.currentTarget)}
          className="shrink-0 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 text-xl p-1"
          title="Task options"
        >
          <Icon name="ellipsis" className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}
