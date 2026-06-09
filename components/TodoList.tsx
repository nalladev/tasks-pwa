'use client'

import { useState, useEffect } from 'react'
import { Todo, addTodo, getTodos, updateTodo, deleteTodo } from '@/lib/db'
import { syncTodos } from '@/lib/sync'

export default function TodoList() {
  const [todos, setTodos] = useState<Todo[]>([])
  const [newTodo, setNewTodo] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadTodos()
  }, [])

  async function loadTodos() {
    setIsLoading(true)
    const allTodos = await getTodos()
    setTodos(allTodos.sort((a, b) => b.createdAt - a.createdAt))
    setIsLoading(false)
  }

  async function handleAddTodo(e: React.FormEvent) {
    e.preventDefault()
    if (!newTodo.trim()) return
    const todo = await addTodo(newTodo.trim())
    setTodos([todo, ...todos])
    setNewTodo('')
    // Try to sync immediately
    syncTodos()
  }

  async function handleToggle(id: string) {
    const todo = todos.find(t => t.id === id)
    if (!todo) return
    await updateTodo(id, { completed: !todo.completed })
    setTodos(todos.map(t =>
      t.id === id ? { ...t, completed: !t.completed } : t
    ))
    syncTodos()
  }

  async function handleDelete(id: string) {
    await deleteTodo(id)
    setTodos(todos.filter(t => t.id !== id))
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-gray-600">Loading tasks...</div>
      </div>
    )
  }

  const completedCount = todos.filter(t => t.completed).length

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Tasks</h1>
          <p className="text-gray-600">
            {completedCount} of {todos.length} completed
          </p>
        </div>

        {/* Add Todo Form */}
        <form onSubmit={handleAddTodo} className="mb-6">
          <div className="flex gap-2">
            <input
              type="text"
              value={newTodo}
              onChange={(e) => setNewTodo(e.target.value)}
              placeholder="What needs to be done?"
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            />
            <button
              type="submit"
              className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition font-medium"
            >
              Add
            </button>
          </div>
        </form>

        {/* Todo List */}
        <div className="space-y-2">
          {todos.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center text-gray-400">
              No tasks yet. Add one to get started!
            </div>
          ) : (
            todos.map(todo => (
              <div
                key={todo.id}
                className="bg-white rounded-lg shadow p-4 flex items-center gap-3 hover:shadow-md transition"
              >
                <input
                  type="checkbox"
                  checked={todo.completed}
                  onChange={() => handleToggle(todo.id)}
                  className="w-5 h-5 text-blue-500 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
                />
                <span
                  className={`flex-1 ${
                    todo.completed
                      ? 'line-through text-gray-400'
                      : 'text-gray-800'
                  }`}
                >
                  {todo.text}
                </span>
                {!todo.synced && (
                  <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                    Pending
                  </span>
                )}
                <button
                  onClick={() => handleDelete(todo.id)}
                  className="px-3 py-1 text-red-500 hover:bg-red-50 rounded transition text-sm"
                >
                  Delete
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
