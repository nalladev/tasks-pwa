import { NextRequest, NextResponse } from 'next/server'
import { adminDb, deletionsCollection } from '@/lib/firebase-admin'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sinceParam = searchParams.get('since')
    const since = sinceParam ? Number(sinceParam) : 0

    // Use a simple ordered query and filter client-side to avoid
    // requiring a composite index for where('deletedAt', '>', ...).
    const snapshot = await adminDb
      .collection(deletionsCollection())
      .orderBy('deletedAt', 'desc')
      .get()

    const deletions: { taskId: string; deletedAt: number }[] = []
    snapshot.forEach((doc) => {
      const data = doc.data()
      const deletedAt = data.deletedAt?.toDate?.() || data.deletedAt
      const ts = deletedAt instanceof Date ? deletedAt.getTime() : Number(deletedAt)
      if (ts > since) {
        deletions.push({ taskId: doc.id, deletedAt: ts })
      }
    })

    return NextResponse.json({ success: true, data: deletions })
  } catch (error) {
    console.error('Error fetching deletions:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch deletions' },
      { status: 500 }
    )
  }
}
