# Firestore Integration Guide

## Overview

The app now has **true offline-first architecture** with Firestore synchronization:

```
Client (React) → IndexedDB (Local Cache) ↔ Sync Engine → Firestore (Cloud)
                    ↓
            Tracks: pending, synced, failed
```

## Architecture

### 1. **Local Storage Layer** (IndexedDB)
- Stores all tasks locally
- Two stores: `tasks` and `sync-queue`
- Tracks sync status: `pending`, `synced`, `failed`
- Persists offline changes until sync succeeds

### 2. **Sync Engine** (lib/sync.ts)
- Detects online/offline transitions
- Queues changes when offline
- Auto-syncs every 30 seconds when online
- Retry logic: 3 retries with 5-second delays
- Handles partial failures gracefully

### 3. **Backend API** (app/api/tasks/)
- **GET /api/tasks** - Fetch latest tasks from Firestore
- **POST /api/tasks/sync** - Sync pending changes to Firestore
- Validates all data server-side
- Uses batch writes for atomic operations

### 4. **Firestore Database**
- Collection: `tasks`
- Stores authoritative task data
- Timestamps for conflict resolution
- Soft deletes (deleted_at field)

## How It Works

### Scenario 1: Creating a Task Online

```
User → Create Task
       ↓
  Save to IndexedDB (status: pending)
       ↓
  Return to UI immediately
       ↓
  Auto-sync triggered → POST /api/tasks/sync
       ↓
  Server validates & writes to Firestore
       ↓
  Mark as synced in IndexedDB
```

### Scenario 2: Creating a Task Offline

```
User → Create Task
       ↓
  Save to IndexedDB (status: pending)
       ↓
  Return to UI immediately
       ↓
  (No sync, no server connection)
       ↓
  [User goes online]
       ↓
  Auto-sync detects online event
       ↓
  Sync pending tasks to Firestore
       ↓
  Mark as synced in IndexedDB
```

### Scenario 3: Editing Offline, Then Online

```
User → Edit Task (while offline)
       ↓
  Update IndexedDB (lastModifiedAt updated)
       ↓
  Status: pending
       ↓
  [User comes online]
       ↓
  Sync sends latest version
       ↓
  Server compares timestamps
       ↓
  Firestore updated
       ↓
  Marked as synced
```

## File Structure

```
lib/
├── db.ts                    # Enhanced with sync metadata
├── firebase-client.ts       # Client-side Firebase init
├── firebase-admin.ts        # Server-side Admin SDK
└── sync.ts                  # Offline-first sync engine

app/api/tasks/
├── route.ts                 # GET endpoint (fetch tasks)
└── sync.ts                  # POST endpoint (sync changes)

components/
└── TaskBoard.tsx            # Calls setupAutoSync() on mount
```

## Database Schema

### IndexedDB: `tasks` Store
```typescript
interface Task {
  id: string                  // UUID, primary key
  text: string                // Task description
  completed: boolean          // Completion status
  createdAt: number           // Unix timestamp
  lastModifiedAt: number      // Unix timestamp (for conflict resolution)
  repeatability: 'never' | 'daily' | 'weekly' | 'monthly'
  scheduledTime?: string      // HH:MM format
  synced: 'pending' | 'synced' | 'failed'  // Sync status
  lastSyncAt?: number         // Last successful sync time
  deletedAt?: number          // Soft delete timestamp
  userId?: string             // For multi-user support
}
```

### Firestore Collection: `tasks`
```
{
  text: "Morning standup"
  completed: false
  createdAt: Timestamp
  lastModifiedAt: Timestamp
  repeatability: "daily"
  scheduledTime: "09:00"
  lastSyncAt: Timestamp
  deletedAt: null | Timestamp
}
```

## Sync Metadata

### Status Tracking

| Status | Meaning | Action |
|--------|---------|--------|
| `pending` | Local change not yet synced | Send to server next sync |
| `synced` | Successfully saved to Firestore | No action needed |
| `failed` | Sync failed, will retry | Retry on next sync |

### Timestamp Management

- **createdAt**: Never changes (set on creation)
- **lastModifiedAt**: Updated on every change (for conflict resolution)
- **lastSyncAt**: Updated after successful sync
- **deletedAt**: Set when task is deleted (soft delete)

## Conflict Resolution

### When Syncing:

1. **If task exists locally but not on server**
   - Create it on Firestore

2. **If task exists on server with older lastModifiedAt**
   - Update it with local version

3. **If task exists on server with newer lastModifiedAt**
   - Keep server version (data loss avoided)
   - Log warning
   - User can re-edit

4. **If task is marked deleted locally (deletedAt set)**
   - Update Firestore with deletedAt timestamp
   - Filter out from display

## Auto-Sync Features

```typescript
// Automatic Sync Triggers:
1. App mounts → setupAutoSync()
2. Online event (window.online)
3. Every 30 seconds (SYNC_INTERVAL)

// Retry Logic:
- Failed sync → Retry after 5 seconds
- Max 3 retries before giving up
- Marked as 'failed' in local DB
- Can retry manually or wait for next auto-sync
```

## Implementing Sync in Components

```typescript
// In any component, sync is automatic
// but you can trigger manually:

import { syncTodos } from '@/lib/sync'

// After creating/editing/deleting a task
syncTodos()  // Trigger sync immediately
```

## Network Status Indicator

The app knows when it's online/offline:

```typescript
navigator.onLine       // true/false
window.addEventListener('online', ...)
window.addEventListener('offline', ...)
```

Component `OnlineStatus.tsx` displays offline banner automatically.

## Future Enhancements

1. **Real-time Listeners** - Subscribe to Firestore changes
   ```typescript
   onSnapshot(collection(db, 'tasks'), (snapshot) => {
     // Update UI with latest from server
   })
   ```

2. **Conflict Resolution UI** - Show merge options when conflicts occur

3. **Sync Analytics** - Track sync success/failure rates

4. **Custom Sync Intervals** - User-configurable auto-sync timing

5. **Selective Sync** - Only sync specific tasks

6. **Compression** - Compress sync payload for slow networks

7. **Batch Splitting** - Send large syncs in chunks

## Testing Offline Mode

### Method 1: DevTools
1. Open DevTools (F12)
2. Network Tab → Throttling → Offline
3. Make changes
4. Go back online to see sync

### Method 2: Simulated Delay
```typescript
// Temporarily add delay in sync.ts
await new Promise(r => setTimeout(r, 5000))
```

### Method 3: Network Conditions
1. DevTools → Network
2. Throttle to slow 3G
3. Watch sync retry logic

## Error Handling

### Sync Failures Are:
- ✅ Logged to console
- ✅ Marked as 'failed' in DB
- ✅ Retried automatically
- ✅ Will retry on next online event
- ✅ User can still work (offline)

### Common Errors:

| Error | Cause | Fix |
|-------|-------|-----|
| Network timeout | Server slow | Retries automatically |
| 400 Bad Request | Invalid data | Check DB schema |
| 403 Forbidden | Auth failed | Re-login required |
| Quota exceeded | Too many writes | Wait or upgrade plan |

## API Endpoints Reference

### GET /api/tasks
Fetch all tasks from Firestore

**Response:**
```json
{
  "success": true,
  "data": [{
    "id": "uuid",
    "text": "Task name",
    "completed": false,
    "repeatability": "daily",
    "scheduledTime": "09:00",
    "createdAt": 1234567890,
    "lastModifiedAt": 1234567890
  }]
}
```

### POST /api/tasks/sync
Sync pending changes to Firestore

**Request:**
```json
{
  "tasks": [{
    "id": "uuid",
    "text": "Task name",
    "completed": false,
    "createdAt": 1234567890,
    "lastModifiedAt": 1234567890,
    "synced": "pending"
  }]
}
```

**Response:**
```json
{
  "success": true,
  "syncedCount": 2,
  "failedCount": 0,
  "syncedTasks": ["uuid1", "uuid2"],
  "failedTasks": []
}
```

## Performance Notes

- **IndexedDB**: Typically < 10ms per operation
- **Sync**: Batched in single transaction
- **Network**: Auto-retry handles slow connections
- **Memory**: All tasks kept in memory (can optimize with pagination)

## Security

⚠️ **Important**: 
- Set up Firestore Security Rules before production
- Currently in Test Mode (allows all reads/writes)
- Add authentication to API routes
- Validate all input server-side (already done)

## Troubleshooting

### Tasks not syncing?
1. Check browser console for errors
2. Open DevTools → Network → check /api/tasks/sync requests
3. Verify .env.local has correct Firebase credentials
4. Check browser supports IndexedDB

### Data not persisting offline?
1. IndexedDB might be disabled in browser
2. Check Storage → IndexedDB in DevTools
3. Private/Incognito mode blocks persistence

### Sync keeps failing?
1. Check Firestore quota in Firebase Console
2. Verify network connection
3. Check Firebase Security Rules allow writes
4. Look for error logs in browser console

