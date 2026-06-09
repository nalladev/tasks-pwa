import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'
import { Task } from '@/lib/db'

export async function GET() {
  try {
    const snapshot = await adminDb.collection('tasks').get()

    const tasks: Task[] = []
    snapshot.forEach((doc) => {
      const data = doc.data()
      if (!data.deletedAt) {
        const createdAt = data.createdAt?.toDate?.() || data.createdAt || new Date()
        const lastModifiedAt = data.lastModifiedAt?.toDate?.() || data.lastModifiedAt || new Date()
        
        tasks.push({
          id: doc.id,
          text: data.text,
          completed: data.completed,
          createdAt: createdAt instanceof Date ? createdAt.getTime() : Number(createdAt),
          lastModifiedAt: lastModifiedAt instanceof Date ? lastModifiedAt.getTime() : Number(lastModifiedAt),
          repeatability: data.repeatability || 'never',
          scheduledTime: data.scheduledTime || undefined,
          synced: 'synced',
          lastSyncAt: data.lastSyncAt,
        })
      }
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
