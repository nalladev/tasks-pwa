'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Task, TaskRepeatability, addTask, getTimedTasks, getOneTimeTasks, updateTodo, deleteTodo } from '@/lib/db'
import { syncTodos, setupAutoSync } from '@/lib/sync'
import Clock from './Clock'
import TimedTasks from './TimedTasks'
import OneTimeTasks from './OneTimeTasks'
import TaskModal from './TaskModal'
import TaskActionMenu from './TaskActionMenu'
import SettingsPopup from './SettingsPopup'

export default function TaskBoard() {
  const [timedTasks, setTimedTasks] = useState<Task[]>([])
  const [oneTimeTasks, setOneTimeTasks] = useState<Task[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [menuOpenTask, setMenuOpenTask] = useState<Task | null>(null)
  const menuPositionRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 })

  const loadTasks = useCallback(async () => {
    setIsLoading(true)
    try {
      const timed = await getTimedTasks()
      const oneTime = await getOneTimeTasks()
      setTimedTasks(timed)
      setOneTimeTasks(oneTime)
    } catch (error) {
      console.error('Error loading tasks:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadTasks()
    // Set up auto-sync on mount
    setupAutoSync()
  }, [loadTasks])

  async function handleAddTask(text: string, repeatability: TaskRepeatability, scheduledTime?: string) {
    const newTask = await addTask(text, repeatability, scheduledTime)
    
    if (repeatability === 'never') {
      setOneTimeTasks([...oneTimeTasks, newTask])
    } else {
      setTimedTasks([...timedTasks, newTask])
    }
    
    setIsModalOpen(false)
    syncTodos()
  }

  async function handleEditTask(text: string, repeatability: TaskRepeatability, scheduledTime?: string) {
    if (!selectedTask) return
    
    const updates = {
      text,
      repeatability,
      scheduledTime: repeatability !== 'never' ? scheduledTime : undefined,
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
  }

  async function handleToggleDone(task: Task) {
    await updateTodo(task.id, { completed: !task.completed })
    
    if (task.repeatability === 'never') {
      setOneTimeTasks(oneTimeTasks.map(t => t.id === task.id ? { ...t, completed: !t.completed } : t))
    } else {
      setTimedTasks(timedTasks.map(t => t.id === task.id ? { ...t, completed: !t.completed } : t))
    }
    
    setMenuOpenTask(null)
    syncTodos()
  }

  async function handleDeleteTask(taskId: string) {
    await deleteTodo(taskId)
    setTimedTasks(timedTasks.filter(t => t.id !== taskId))
    setOneTimeTasks(oneTimeTasks.filter(t => t.id !== taskId))
    setMenuOpenTask(null)
  }

  function handleTaskMenuOpen(task: Task, buttonElement: HTMLElement) {
    const rect = buttonElement.getBoundingClientRect()
    menuPositionRef.current = {
      x: rect.right,
      y: rect.top,
    }
    setMenuOpenTask(task)
  }

  if (isLoading) {
    return (
        <div className="flex items-center justify-center min-h-screen bg-linear-to-br from-gray-50 to-gray-100">
          <div className="text-gray-600">Loading tasks...</div>
        </div>
      )
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 p-6">
      {/* Header with Settings */}
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold text-gray-800">Tasks Board</h1>
          <p className="text-gray-600 mt-1">Organize your day</p>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition font-medium"
          >
            + New Task
          </button>
          
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="px-4 py-3 text-gray-600 hover:bg-gray-200 rounded-lg transition"
            title="Settings"
          >
            ⚙️
          </button>
        </div>
      </div>

      {/* Three Column Layout */}
      <div className="grid grid-cols-3 gap-6 h-[calc(100vh-180px)]">
        {/* Column 1: Clock */}
        <div>
          <Clock />
        </div>

        {/* Column 2: Timed Tasks */}
        <div>
          <TimedTasks 
            tasks={timedTasks}
            onTaskMenuOpen={handleTaskMenuOpen}
          />
        </div>

        {/* Column 3: One-Time Tasks */}
        <div>
          <OneTimeTasks 
            tasks={oneTimeTasks}
            onTaskMenuOpen={handleTaskMenuOpen}
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

      <SettingsPopup
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  )
}
