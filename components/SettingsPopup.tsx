'use client'

interface SettingsPopupProps {
  isOpen: boolean
  onClose: () => void
}

export default function SettingsPopup({ isOpen, onClose }: SettingsPopupProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-96 overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">Settings</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="text-gray-600">
            <p className="text-sm">Settings options coming soon...</p>
          </div>
        </div>
      </div>
    </div>
  )
}
