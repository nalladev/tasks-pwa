'use client'

import { useState, useEffect, useCallback } from 'react'
import { getCompletedTasks, Task } from '@/lib/db'
import FullPageOverlay from './FullPageOverlay'
import Icon from './Icon'

interface LeaderboardEntry {
  name: string
  count: number
  lastCompletedAt: number
}

function aggregateByUser(tasks: Task[]): LeaderboardEntry[] {
  const map = new Map<string, { count: number; lastCompletedAt: number }>()

  for (const task of tasks) {
    const names = task.assignedTo
      ? task.assignedTo.split(',').map(s => s.trim()).filter(Boolean)
      : ['Unknown']

    // Debug logging for completedAt type issues
    const rawCompletedAt: unknown = task.completedAt
    if (rawCompletedAt != null && typeof rawCompletedAt !== 'number') {
      console.warn('[Leaderboard] Unexpected completedAt type:', {
        id: task.id,
        text: task.text.slice(0, 30),
        assignedTo: task.assignedTo,
        completedAt: rawCompletedAt,
        type: typeof rawCompletedAt,
      })
    }

    for (const name of names) {
      const existing = map.get(name)
      if (existing) {
        existing.count++
        if (task.completedAt && task.completedAt > existing.lastCompletedAt) {
          existing.lastCompletedAt = task.completedAt
        }
      } else {
        map.set(name, {
          count: 1,
          lastCompletedAt: task.completedAt || 0,
        })
      }
    }
  }

  return Array.from(map.entries())
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.count - a.count || b.lastCompletedAt - a.lastCompletedAt)
}

interface LeaderboardTier {
  rank: number
  count: number
  names: string[]
  lastCompletedAt: number
}

/**
 * Group entries with the same count into tiers.
 */
function groupIntoTiers(entries: LeaderboardEntry[]): LeaderboardTier[] {
  const tiers: LeaderboardTier[] = []
  let rank = 0

  for (const entry of entries) {
    const prev = tiers[tiers.length - 1]
    if (prev && prev.count === entry.count) {
      // Same tier — add name, keep latest completion
      prev.names.push(entry.name)
      if (entry.lastCompletedAt > prev.lastCompletedAt) {
        prev.lastCompletedAt = entry.lastCompletedAt
      }
    } else {
      // New tier
      rank++
      tiers.push({
        rank,
        count: entry.count,
        names: [entry.name],
        lastCompletedAt: entry.lastCompletedAt,
      })
    }
  }

  return tiers
}

function formatDate(timestamp: number): string {
  if (!timestamp) return 'N/A'
  const date = new Date(timestamp)
  if (isNaN(date.getTime())) {
    console.warn('[Leaderboard] Invalid date from timestamp:', { timestamp, type: typeof timestamp })
    return 'N/A'
  }
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

const PODIUM_EMOJIS = ['🥇', '🥈', '🥉']

const RANK_COLORS = [
  'bg-amber-50 dark:bg-amber-900/30 border-amber-300 dark:border-amber-600',
  'bg-gray-50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600',
  'bg-orange-50 dark:bg-orange-900/30 border-orange-300 dark:border-orange-600',
]

interface LeaderboardPanelProps {
  isOpen: boolean
  onClose: () => void
}

export default function LeaderboardPanel({ isOpen, onClose }: LeaderboardPanelProps) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const completedTasks = await getCompletedTasks()
      const grouped = aggregateByUser(completedTasks)
      setEntries(grouped)
    } catch (error) {
      console.error('Failed to load leaderboard:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    if (isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      loadData()
    }
  }, [isOpen, loadData])

  function handleRefresh() {
    setRefreshing(true)
    loadData()
  }

  const totalCompleted = entries.reduce((sum, e) => sum + e.count, 0)

  return (
    <FullPageOverlay
      isOpen={isOpen}
      onClose={onClose}
      title="Leaderboard"
      subtitle={loading ? '' : `${totalCompleted} task${totalCompleted !== 1 ? 's' : ''} completed`}
    >
      <div className="p-4 md:p-6 max-w-2xl mx-auto">
        {/* Refresh button */}
        <div className="flex justify-end mb-4">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition flex items-center gap-2 text-sm"
            title="Refresh data"
          >
            <Icon name="check" className="w-4 h-4" />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-gray-600 dark:text-gray-400">Loading leaderboard...</div>
          </div>
        ) : entries.length === 0 ? (
          /* Empty State */
          <div className="flex items-center justify-center py-20">
            <div className="text-center max-w-md">
              <div className="text-5xl mb-4">🏆</div>
              <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">No completed tasks yet</h2>
              <p className="text-gray-600 dark:text-gray-400">
                Complete a task and it will appear here on the leaderboard!
              </p>
            </div>
          </div>
        ) : (
          /* Leaderboard — grouped into tiers */
          <div className="space-y-4">
            {(() => {
              const tiers = groupIntoTiers(entries)
              return tiers.map((tier, tierIndex) => {
                const isPodium = tierIndex < 3
                const cardStyle = isPodium
                  ? RANK_COLORS[tierIndex]
                  : 'bg-white dark:bg-gray-800 border-transparent'

                return (
                  <div
                    key={tier.rank}
                    className={`rounded-lg shadow-lg border-2 p-4 md:p-5 transition hover:shadow-xl ${cardStyle}`}
                  >
                    <div className="flex items-center gap-4">
                      {/* Rank */}
                      <div className="shrink-0 w-10 h-10 flex items-center justify-center">
                        {isPodium ? (
                          <span className="text-2xl">{PODIUM_EMOJIS[tierIndex]}</span>
                        ) : (
                          <span className="text-lg font-bold text-gray-500 dark:text-gray-400">
                            #{tier.rank}
                          </span>
                        )}
                      </div>

                      {/* Names */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap gap-1.5">
                          {tier.names.map((name) => (
                            <span
                              key={name}
                              className="inline-flex items-center gap-1 text-sm font-medium px-2.5 py-1 rounded-full bg-white/70 dark:bg-gray-700/70 text-gray-800 dark:text-gray-100"
                            >
                              <Icon name="user" className="w-3.5 h-3.5 shrink-0" />
                              {name}
                            </span>
                          ))}
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1.5">
                          Last completed: {formatDate(tier.lastCompletedAt)}
                        </p>
                      </div>

                      {/* Count */}
                      <div className="shrink-0 text-right">
                        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                          {tier.count}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          task{tier.count !== 1 ? 's' : ''}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })
            })()}
          </div>
        )}
      </div>
    </FullPageOverlay>
  )
}
