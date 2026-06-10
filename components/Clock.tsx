'use client'

import { useState, useEffect } from 'react'

export default function Clock() {
  const [time, setTime] = useState<string>('')

  useEffect(() => {
    // Set initial time
    const updateTime = () => {
      const now = new Date()
      setTime(now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }))
    }

    updateTime()
    const interval = setInterval(updateTime, 1000)
    return () => clearInterval(interval)
  }, [])

  if (!time) return null // Avoid hydration mismatch

  return (
    <div className="flex flex-col items-center justify-center bg-linear-to-b from-blue-500 to-blue-600 rounded-lg shadow-lg md:p-6 p-4">
      <div className="text-3xl md:text-6xl font-bold text-white font-mono text-center">{time}</div>
      <div className="text-blue-100 mt-2 md:mt-4 text-sm">
        {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
      </div>
    </div>
  )
}
