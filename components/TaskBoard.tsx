'use client'

import { useState, useEffect, useSyncExternalStore } from 'react'
import { Task, TaskRepeatability, TaskCategory, addTask, getTimedTasks, getOneTimeTasks, updateTodo, deleteTodo, updateTaskPriority } from '@/lib/db'
import { syncTodos, setupAutoSync, pullFromServer } from '@/lib/sync'
import Clock from './Clock'
import TimedTasks from './TimedTasks'
import OneTimeTasks from './OneTimeTasks'
import TaskModal from './TaskModal'
import TaskActionMenu from './TaskActionMenu'
import SettingsPopup from './SettingsPopup'
import LeaderboardPanel from './LeaderboardPanel'
import RecycleBinPanel from './RecycleBinPanel'
import Icon from './Icon'

const subscribeToHydration = () => () => {}
const getClientHydrationSnapshot = () => true
const getServerHydrationSnapshot = () => false

export default function TaskBoard() {
  const [timedTasks, setTimedTasks] = useState<Task[]>([])
  const [oneTimeTasks, setOneTimeTasks] = useState<Task[]>([])
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)
  const isHydrated = useSyncExternalStore(
    subscribeToHydration,
    getClientHydrationSnapshot,
    getServerHydrationSnapshot
  )
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false)
  const [isRecycleBinOpen, setIsRecycleBinOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [menuOpenTask, setMenuOpenTask] = useState<Task | null>(null)
  const [menuPosition, setMenuPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 })

  const POLL_INTERVAL = 30000

  async function reloadTasks() {
    const timed = await getTimedTasks()
    const oneTime = await getOneTimeTasks()
    setTimedTasks(timed)
    setOneTimeTasks(oneTime)
  }

  useEffect(() => {
    async function loadTasks() {
      // First, load from IndexedDB immediately
      setIsInitialLoad(true)
      try {
        await reloadTasks()
        setIsInitialLoad(false)

        // Then pull from server in background
        setIsSyncing(true)
        await pullFromServer()
        await reloadTasks()
      } catch (error) {
        console.error('Error loading tasks:', error)
      } finally {
        setIsInitialLoad(false)
        setIsSyncing(false)
      }
    }

    if (isHydrated) {
      loadTasks()
      setupAutoSync()
    }
  }, [isHydrated])

  // Poll for changes from other devices
  useEffect(() => {
    if (!isHydrated) return

    async function poll() {
      if (!navigator.onLine) return
      const changed = await pullFromServer()
      if (changed) {
        await reloadTasks()
      }
    }

    function onVisibilityChange() {
      if (document.visibilityState === 'visible') poll()
    }

    const intervalId = setInterval(poll, POLL_INTERVAL)

    window.addEventListener('visibilitychange', onVisibilityChange)
    window.addEventListener('focus', poll)
    window.addEventListener('online', poll)

    return () => {
      clearInterval(intervalId)
      window.removeEventListener('visibilitychange', onVisibilityChange)
      window.removeEventListener('focus', poll)
      window.removeEventListener('online', poll)
    }
  }, [isHydrated])

  function handleAddTask(text: string, repeatability: TaskRepeatability, scheduledTime?: string, category?: TaskCategory, scheduledDate?: string, assignedTo?: string) {
    (async () => {
    const priority = repeatability === 'never' ? 1 : undefined
    const newTask = await addTask(text, repeatability, scheduledTime, category, priority, scheduledDate, assignedTo)

    if (repeatability === 'never') {
      // Reassign priorities so all incomplete one-time tasks are sequential (1, 2, 3, ...)
      const allOneTime = await getOneTimeTasks()
      const incomplete = allOneTime
        .filter(t => !t.completed)
        .sort((a, b) => {
          const pa = a.priority ?? 9999
          const pb = b.priority ?? 9999
          if (pa !== pb) return pa - pb
          return b.createdAt - a.createdAt
        })

      for (let i = 0; i < incomplete.length; i++) {
        const newPriority = i + 1
        const task = incomplete[i]
        if (task.priority !== newPriority) {
          await updateTaskPriority(task.id, newPriority)
        }
      }

      await reloadTasks()
    } else {
      setTimedTasks([...timedTasks, newTask])
    }

    setIsModalOpen(false)
    syncTodos()
    })()
  }

  function handleEditTask(text: string, repeatability: TaskRepeatability, scheduledTime?: string, category?: TaskCategory, scheduledDate?: string, assignedTo?: string) {
    (async () => {
    if (!selectedTask) return

    const updates = {
      text,
      repeatability,
      scheduledTime,
      scheduledDate: repeatability === 'never' ? scheduledDate : undefined,
      category,
      assignedTo,
    }

    await updateTodo(selectedTask.id, updates)

    // Update local state
    if (selectedTask.repeatability === 'never' && repeatability === 'never') {
      // Stays in one-time
      setOneTimeTasks(oneTimeTasks.map(t => t.id === selectedTask.id ? { ...t, ...updates } : t))
    } else if (selectedTask.repeatability !== 'never' && repeatability !== 'never') {
      // Stays in timed
      setTimedTasks(timedTasks.map(t => t.id === selectedTask.id ? { ...t, ...updates } : t))
    } else if (repeatability === 'never') {
      // Move to one-time
      setTimedTasks(timedTasks.filter(t => t.id !== selectedTask.id))
      setOneTimeTasks([...oneTimeTasks, { ...selectedTask, ...updates }])
    } else {
      // Move to timed
      setOneTimeTasks(oneTimeTasks.filter(t => t.id !== selectedTask.id))
      setTimedTasks([...timedTasks, { ...selectedTask, ...updates }])
    }

    setSelectedTask(null)
    setIsModalOpen(false)
    syncTodos()
    })()
  }

  function handleToggleDone(task: Task) {
    (async () => {
    const completing = !task.completed
    const updates: Partial<Task> = { completed: completing, completedAt: completing ? Date.now() : undefined }

    await updateTodo(task.id, updates)

    if (task.repeatability === 'never') {
      setOneTimeTasks(oneTimeTasks.map(t => t.id === task.id ? { ...t, ...updates } : t))
    } else {
      setTimedTasks(timedTasks.map(t => t.id === task.id ? { ...t, ...updates } : t))
    }

    setMenuOpenTask(null)
    syncTodos()
    })()
  }

  function handleReorderTask(taskId: string, direction: 'up' | 'down') {
    (async () => {
      // Get the current sorted list of incomplete one-time tasks
      const allOneTime = await getOneTimeTasks()
      const incomplete = allOneTime
        .filter(t => !t.completed)
        .sort((a, b) => {
          const pa = a.priority ?? 9999
          const pb = b.priority ?? 9999
          if (pa !== pb) return pa - pb
          return b.createdAt - a.createdAt
        })

      const idx = incomplete.findIndex(t => t.id === taskId)
      if (idx === -1) return

      const swapIdx = direction === 'up' ? idx - 1 : idx + 1
      if (swapIdx < 0 || swapIdx >= incomplete.length) return

      // Physically move the task in the array
      // Simply swap priority values between the two adjacent tasks
      const currentTask = incomplete[idx]
      const swapTask = incomplete[swapIdx]

      const currentPriority = currentTask.priority ?? idx + 1
      const swapPriority = swapTask.priority ?? swapIdx + 1

      // Swap their priorities
      await updateTaskPriority(currentTask.id, swapPriority)
      await updateTaskPriority(swapTask.id, currentPriority)

      await reloadTasks()
      syncTodos()
    })()
  }

  function handleDeleteTask(taskId: string) {
    (async () => {
    await deleteTodo(taskId)
    setTimedTasks(timedTasks.filter(t => t.id !== taskId))
    setOneTimeTasks(oneTimeTasks.filter(t => t.id !== taskId))
    setMenuOpenTask(null)
    })()
  }

  function handleTaskMenuOpen(task: Task, buttonElement: HTMLElement) {
    const rect = buttonElement.getBoundingClientRect()
    setMenuPosition({
      x: rect.right,
      y: rect.top,
    })
    setMenuOpenTask(task)
  }

  // Prevent hydration mismatch by showing empty state until hydrated
  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-6 flex flex-col" />
    )
  }

  if (isInitialLoad) {
    return (
      <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-6 flex flex-col">
        <div className="flex items-center justify-center flex-1">
          <div className="text-gray-600 dark:text-gray-400 flex items-center gap-2">
            <span className="animate-pulse">Loading tasks...</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-6 flex flex-col">
      {/* Header with Settings */}
      <div className="mb-6 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div>
            <h1 className="text-xl md:text-4xl font-bold text-gray-800 dark:text-gray-100">Tasks Board</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Organize your day</p>
          </div>
          {isSyncing && (
            <Icon name="sparkles" className="w-5 h-5 text-blue-500 animate-spin" />
          )}
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-3 md:px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition font-medium flex items-center gap-2"
          >
            <Icon name="plus" className="w-5 h-5" /><span className="hidden md:inline">New Task</span>
          </button>

          <button
            onClick={() => setIsLeaderboardOpen(true)}
            className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition"
            title="Leaderboard"
          >
            <Icon name="trophy" className="w-6 h-6" />
          </button>

          <button
            onClick={() => setIsRecycleBinOpen(true)}
            className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition"
            title="Recycle Bin"
          >
            <Icon name="trash" className="w-6 h-6" />
          </button>

          <button
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition"
            title="Settings"
          >
            <Icon name="settings" className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Responsive Layout: vertical on mobile, 3-column grid on desktop */}
      <div className="flex flex-col md:grid md:grid-cols-3 gap-6 md:h-[calc(100vh-180px)] flex-1 md:flex-none min-h-0">
        {/* Clock: auto height on mobile, column on desktop */}
        <div className="md:contents">
          <Clock />
        </div>

        {/* Timed Tasks: flex-1 on mobile, column on desktop */}
        <div className="flex-1 min-h-0 md:contents">
          <TimedTasks
            tasks={timedTasks}
            onTaskMenuOpen={handleTaskMenuOpen}
          />
        </div>

        {/* One-Time Tasks: flex-1 on mobile, column on desktop */}
        <div className="flex-1 min-h-0 md:contents">
          <OneTimeTasks
            tasks={oneTimeTasks}
            onTaskMenuOpen={handleTaskMenuOpen}
            onReorder={handleReorderTask}
          />
        </div>
      </div>

      {/* Modals */}
      <TaskModal
        isOpen={isModalOpen && !selectedTask}
        onClose={() => setIsModalOpen(false)}
        onSave={handleAddTask}
      />

      <TaskModal
        key={selectedTask?.id ?? 'new'}
        isOpen={isModalOpen && !!selectedTask}
        onClose={() => {
          setIsModalOpen(false)
          setSelectedTask(null)
        }}
        onSave={handleEditTask}
        task={selectedTask || undefined}
      />

      <TaskActionMenu
        isOpen={!!menuOpenTask}
        task={menuOpenTask || ({} as Task)}
        position={menuPosition}
        onEdit={() => {
          if (menuOpenTask) {
            setSelectedTask(menuOpenTask)
            setIsModalOpen(true)
          }
        }}
        onToggleDone={() => {
          if (menuOpenTask) {
            handleToggleDone(menuOpenTask)
          }
        }}
        onDelete={() => {
          if (menuOpenTask) {
            handleDeleteTask(menuOpenTask.id)
          }
        }}
        onClose={() => setMenuOpenTask(null)}
      />

      {/* Full-page overlays */}
      <LeaderboardPanel
        isOpen={isLeaderboardOpen}
        onClose={() => setIsLeaderboardOpen(false)}
      />

      <RecycleBinPanel
        isOpen={isRecycleBinOpen}
        onClose={() => setIsRecycleBinOpen(false)}
      />

      <SettingsPopup
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  )
}
