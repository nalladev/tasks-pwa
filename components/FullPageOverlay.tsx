'use client'

import { ReactNode } from 'react'
import Icon from './Icon'

interface FullPageOverlayProps {
  isOpen: boolean
  onClose: () => void
  title: ReactNode
  subtitle?: string
  children: ReactNode
}

export default function FullPageOverlay({ isOpen, onClose, title, subtitle, children }: FullPageOverlayProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white dark:bg-gray-900">
      {/* Header bar with close button */}
      <div className="shrink-0 flex items-center justify-between px-4 md:px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-800 dark:text-gray-100">{title}</h1>
          {subtitle && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{subtitle}</p>
          )}
        </div>
        <button
          onClick={onClose}
          className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
          title="Close"
        >
          <Icon name="close" className="w-6 h-6" />
        </button>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        {children}
      </div>
    </div>
  )
}
