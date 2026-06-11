import { NextRequest, NextResponse } from 'next/server'
import { adminDb, tasksCollection } from '@/lib/firebase-admin'

export async function POST(request: NextRequest) {
  try {
    const { id } = await request.json()

    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Invalid payload: id must be a string' },
        { status: 400 }
      )
    }

    await adminDb.collection(tasksCollection()).doc(id).delete()

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting task:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete task' },
      { status: 500 }
    )
  }
}
