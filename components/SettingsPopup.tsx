'use client'

import { useTheme, type Theme } from '@/lib/theme'
import FullPageOverlay from './FullPageOverlay'
import Icon from './Icon'

interface SettingsPopupProps {
  isOpen: boolean
  onClose: () => void
}

const themeOptions: { value: Theme; label: string; icon: string }[] = [
  { value: 'system', label: 'System', icon: 'sparkles' },
  { value: 'light', label: 'Light', icon: 'sun' },
  { value: 'dark', label: 'Dark', icon: 'moon' },
]

export default function SettingsPopup({ isOpen, onClose }: SettingsPopupProps) {
  const { theme, setTheme } = useTheme()

  return (
    <FullPageOverlay isOpen={isOpen} onClose={onClose} title="Settings">
      <div className="p-4 md:p-6 max-w-md mx-auto">
        {/* Theme Section */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Theme
          </label>
          <div className="grid grid-cols-3 gap-3">
            {themeOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setTheme(option.value)}
                className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition ${
                  theme === option.value
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                    : 'border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-500'
                }`}
              >
                <Icon name={option.icon} className="w-6 h-6" />
                <span className="text-sm font-medium">{option.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </FullPageOverlay>
  )
}
