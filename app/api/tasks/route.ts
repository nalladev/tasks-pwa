import { NextResponse } from 'next/server'
import { adminDb, tasksCollection } from '@/lib/firebase-admin'
import { Task } from '@/lib/db'

export async function GET() {
  try {
    const snapshot = await adminDb.collection(tasksCollection()).get()

    const tasks: Task[] = []
    snapshot.forEach((doc) => {
      const data = doc.data()
      const createdAt = data.createdAt?.toDate?.() || data.createdAt || new Date()
      const lastModifiedAt = data.lastModifiedAt?.toDate?.() || data.lastModifiedAt || new Date()

      const task: Task = {
        id: doc.id,
        text: data.text,
        completed: data.completed,
        createdAt: createdAt instanceof Date ? createdAt.getTime() : Number(createdAt),
        lastModifiedAt: lastModifiedAt instanceof Date ? lastModifiedAt.getTime() : Number(lastModifiedAt),
        repeatability: data.repeatability || 'never',
        scheduledTime: data.scheduledTime || undefined,
        scheduledDate: data.scheduledDate || undefined,
        category: data.category || undefined,
        priority: data.priority ?? undefined,
        assignedTo: data.assignedTo || undefined,
        synced: 'synced',
        lastSyncAt: data.lastSyncAt,
      }

      if (data.deletedAt) {
        const deletedAt = data.deletedAt?.toDate?.() || data.deletedAt || new Date()
        task.deletedAt = deletedAt instanceof Date ? deletedAt.getTime() : Number(deletedAt)
      }

      if (data.completedAt) {
        const completedAt = data.completedAt?.toDate?.() || data.completedAt
        task.completedAt = completedAt instanceof Date ? completedAt.getTime() : Number(completedAt)
      }

      tasks.push(task)
    })

    return NextResponse.json({ success: true, data: tasks })
  } catch (error) {
    console.error('Error fetching tasks:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch tasks' },
      { status: 500 }
    )
  }
}
