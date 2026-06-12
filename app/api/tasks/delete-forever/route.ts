import { NextRequest, NextResponse } from 'next/server'
import { adminDb, tasksCollection, deletionsCollection } from '@/lib/firebase-admin'

export async function POST(request: NextRequest) {
  try {
    const { id } = await request.json()

    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Invalid payload: id must be a string' },
        { status: 400 }
      )
    }

    // Record the deletion tombstone before removing the document.
    // This is how other devices learn about the hard deletion during pull.
    await adminDb.collection(deletionsCollection()).doc(id).set({
      taskId: id,
      deletedAt: new Date(),
    })

    // Hard delete the document from the tasks collection
    await adminDb.collection(tasksCollection()).doc(id).delete()

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error permanently deleting task:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to permanently delete task' },
      { status: 500 }
    )
  }
}
