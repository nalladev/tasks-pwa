import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'
import { Task } from '@/lib/db'

interface SyncPayload {
  tasks: Task[]
}

export async function POST(request: NextRequest) {
  try {
    const payload: SyncPayload = await request.json()
    const { tasks } = payload

    if (!Array.isArray(tasks)) {
      return NextResponse.json(
        { success: false, error: 'Invalid payload: tasks must be an array' },
        { status: 400 }
      )
    }

    const batch = adminDb.batch()
    const syncedTasks: string[] = []
    const failedTasks: string[] = []

    for (const task of tasks) {
      try {
        if (task.deletedAt) {
          // Soft delete: mark as deleted
          batch.update(adminDb.collection('tasks').doc(task.id), {
            deletedAt: new Date(task.deletedAt),
            lastModifiedAt: new Date(task.lastModifiedAt),
          })
        } else {
          // Create or update
          batch.set(
            adminDb.collection('tasks').doc(task.id),
            {
              text: task.text,
              completed: task.completed,
              createdAt: new Date(task.createdAt),
              lastModifiedAt: new Date(task.lastModifiedAt),
              repeatability: task.repeatability,
              scheduledTime: task.scheduledTime || null,
              lastSyncAt: new Date(),
            },
            { merge: true }
          )
        }
        syncedTasks.push(task.id)
      } catch (err) {
        console.error(`Failed to sync task ${task.id}:`, err)
        failedTasks.push(task.id)
      }
    }

    await batch.commit()

    return NextResponse.json({
      success: true,
      syncedCount: syncedTasks.length,
      failedCount: failedTasks.length,
      syncedTasks,
      failedTasks,
    })
  } catch (error) {
    console.error('Sync error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to sync tasks' },
      { status: 500 }
    )
  }
}
