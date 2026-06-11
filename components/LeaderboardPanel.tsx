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
  'bg-yellow-50 dark:bg-yellow-900/30 border-yellow-400 dark:border-yellow-600',    // 🥇 Gold
  'bg-slate-50 dark:bg-slate-700/50 border-slate-300 dark:border-slate-500',       // 🥈 Silver
  'bg-orange-50 dark:bg-orange-900/30 border-orange-400 dark:border-orange-600',   // 🥉 Bronze
]

/**
 * Compute sizing classes based on rank position (0 = highest rank).
 * Higher ranks get larger paddings, fonts, and icons; lower ranks scale down.
 */
function getRankSizing(tierIndex: number) {
  if (tierIndex === 0) {
    return {
      cardPad: 'p-5 md:p-7',
      emojiSize: 'text-3xl',
      rankNumSize: 'text-xl',
      nameChipSize: 'text-sm px-3 py-1.5',
      nameIconSize: 'w-4 h-4',
      countSize: 'text-3xl',
      countLabelSize: 'text-xs',
    }
  }
  if (tierIndex === 1) {
    return {
      cardPad: 'p-4 md:p-6',
      emojiSize: 'text-2xl',
      rankNumSize: 'text-lg',
      nameChipSize: 'text-sm px-2.5 py-1',
      nameIconSize: 'w-3.5 h-3.5',
      countSize: 'text-2xl',
      countLabelSize: 'text-xs',
    }
  }
  if (tierIndex === 2) {
    return {
      cardPad: 'p-4 md:p-5',
      emojiSize: 'text-2xl',
      rankNumSize: 'text-base',
      nameChipSize: 'text-xs px-2 py-1',
      nameIconSize: 'w-3 h-3',
      countSize: 'text-xl',
      countLabelSize: 'text-[11px]',
    }
  }
  // Tiers 4+ — progressively smaller, capped at a minimum
  const shrink = Math.min(tierIndex - 2, 3)
  const padMap = [4, 3, 2, 2]
  const padMdMap = [5, 4, 3, 3]
  const countMap = ['text-xl', 'text-lg', 'text-base', 'text-base']
  return {
    cardPad: `p-${padMap[shrink]} md:p-${padMdMap[shrink]}`,
    emojiSize: 'text-lg',
    rankNumSize: 'text-sm',
    nameChipSize: 'text-xs px-2 py-0.5',
    nameIconSize: 'w-2.5 h-2.5',
    countSize: countMap[shrink],
    countLabelSize: 'text-[10px]',
  }
}

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
                const isLowRank = tierIndex >= 6
                const cardStyle = isPodium
                  ? RANK_COLORS[tierIndex]
                  : 'bg-white dark:bg-gray-800 border-transparent'

                const size = getRankSizing(tierIndex)
                const gapClass = isLowRank ? 'gap-3' : 'gap-4'

                return (
                  <div
                    key={tier.rank}
                    className={`rounded-lg shadow-lg border-2 ${size.cardPad} transition hover:shadow-xl ${cardStyle}`}
                  >
                    <div className={`flex items-center ${gapClass}`}>
                      {/* Rank */}
                      <div className="shrink-0 flex items-center justify-center">
                        {isPodium ? (
                          <span className={size.emojiSize}>{PODIUM_EMOJIS[tierIndex]}</span>
                        ) : (
                          <span className={`${size.rankNumSize} font-bold text-gray-500 dark:text-gray-400`}>
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
                              className={`inline-flex items-center gap-1 font-medium ${size.nameChipSize} rounded-full bg-white/70 dark:bg-gray-700/70 text-gray-800 dark:text-gray-100`}
                            >
                              <Icon name="user" className={`${size.nameIconSize} shrink-0`} />
                              {name}
                            </span>
                          ))}
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1.5">
                          Last completed: {formatDate(tier.lastCompletedAt)}
                        </p>
                      </div>

                      {/* Count */}
                      <div className={`shrink-0 text-right ${isLowRank ? 'ml-auto' : ''}`}>
                        <div className={`${size.countSize} font-bold text-blue-600 dark:text-blue-400`}>
                          {tier.count}
                        </div>
                        <div className={`${size.countLabelSize} text-gray-500 dark:text-gray-400`}>
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
