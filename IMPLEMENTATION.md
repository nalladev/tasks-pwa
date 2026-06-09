# Tasks PWA - Three-Column Layout Implementation

## Overview
Successfully implemented a three-column task management SPA with time-based scheduling, task repeatability, and full offline support using IndexedDB.

## Architecture

### Three-Column Layout

1. **Column 1: Clock**
   - Real-time clock display (updates every second)
   - Shows current date
   - Component: `Clock.tsx`

2. **Column 2: Scheduled Tasks**
   - Time-based task scheduling
   - Supports daily, weekly, monthly repetition
   - Automatically scrolls to the current time's task
   - Shows a pointer box to Column 3 when no task is scheduled for current time
   - Component: `TimedTasks.tsx`

3. **Column 3: One-Time Tasks**
   - Non-repeating, unscheduled tasks
   - Separated into "To Do" and "Completed" sections
   - Can be marked as done or deleted
   - Component: `OneTimeTasks.tsx`

## Database Schema

Updated IndexedDB schema to support new task types:

```typescript
interface Task {
  id: string
  text: string
  completed: boolean
  createdAt: number
  synced: boolean
  repeatability: 'never' | 'daily' | 'weekly' | 'monthly'
  scheduledTime?: string  // HH:MM format, e.g., "14:30"
}
```

### New Database Functions
- `addTask(text, repeatability, scheduledTime?)` - Create tasks with scheduling
- `getTimedTasks()` - Fetch repeating tasks
- `getOneTimeTasks()` - Fetch non-repeating tasks

## Components

### Core Components

1. **TaskBoard.tsx** - Main orchestrator
   - Manages state for timed and one-time tasks
   - Handles task CRUD operations
   - Manages modals and menus

2. **TaskModal.tsx** - Task creation/editing dialog
   - Text input for task description
   - Radio buttons for repeatability (Never, Daily, Weekly, Monthly)
   - Time picker (only shown for repeating tasks)
   - Conditional scheduledTime field

3. **TaskActionMenu.tsx** - Context menu for tasks
   - Edit option
   - Mark done/Undo option
   - Delete option

4. **SettingsPopup.tsx** - Settings panel
   - Extensible for future settings
   - Close button in header

5. **Clock.tsx** - Live clock display
   - HH:MM:SS format
   - Current date

6. **TimedTasks.tsx** - Scheduled tasks list
   - Sorts tasks by scheduled time
   - Highlights current time's task
   - Auto-scrolls to current time task
   - Shows "Do one-time tasks" pointer when no task scheduled

7. **OneTimeTasks.tsx** - One-time tasks list
   - Separates pending and completed tasks
   - Checkbox indicators
   - Pending sync status

## Features Implemented

✅ Three-column responsive layout  
✅ Task creation with repeatability options  
✅ Time-based task scheduling  
✅ Auto-scrolling to current time's task  
✅ Task editing with category switching  
✅ Mark tasks as done  
✅ Delete tasks  
✅ Settings panel (extensible)  
✅ Offline support via IndexedDB  
✅ Sync status tracking  
✅ One-time and recurring task separation  

## Usage

### Creating a Task
1. Click "+ New Task" button
2. Enter task description
3. Select repeatability (One-time, Daily, Weekly, Monthly)
4. If repeating, optionally set a time of day
5. Click Save

### Scheduling Example
- **Morning standup**: Daily at 09:00
- **Weekly review**: Weekly at 17:00
- **Monthly retrospective**: Monthly at 14:00
- **Quick fix**: One-time (no time required)

### Task Actions
- Click the ⋮ button on any task to open the action menu
- Edit, Mark Done, or Delete

## Styling

- Tailwind CSS for responsive design
- Color-coded columns:
  - Column 1: Blue gradient (Clock)
  - Column 2: Purple gradient (Scheduled Tasks)
  - Column 3: Green gradient (One-Time Tasks)
- Highlighted current task in yellow
- Completed tasks show with strikethrough and reduced opacity

## Offline Capabilities

- All tasks stored in IndexedDB
- Full CRUD operations work offline
- Sync status tracked per task
- Automatic sync when connection restored
- "Pending" indicator shows unsynced tasks

## File Structure

```
components/
├── Clock.tsx              # Live clock display
├── TimedTasks.tsx         # Scheduled tasks column
├── OneTimeTasks.tsx       # One-time tasks column
├── TaskBoard.tsx          # Main orchestrator
├── TaskModal.tsx          # Task creation/editing
├── TaskActionMenu.tsx     # Context menu
├── SettingsPopup.tsx      # Settings panel
├── OnlineStatus.tsx       # Offline indicator (existing)
└── TodoList.tsx           # Legacy (kept for reference)

lib/
├── db.ts                  # Updated with Task interface
├── sync.ts                # Sync logic (existing)
```

## Next Steps (Optional)

1. **Backend Integration**: Connect sync.ts to actual API endpoint
2. **Notifications**: Add browser notifications for upcoming tasks
3. **Dark Mode**: Add settings toggle for theme
4. **Import/Export**: Allow exporting tasks as JSON
5. **Recurring Task Logic**: Handle recurrence across days (e.g., auto-create next week's task)
6. **Drag & Drop**: Reorder tasks
7. **Categories/Tags**: Organize tasks by category
8. **Duration Estimates**: Add time estimates for tasks

## Testing

To test offline functionality:
1. Build: `pnpm build`
2. Start: `pnpm start`
3. Open DevTools → Network → Throttle to Offline
4. Add, edit, delete tasks - all work offline
5. Unthrottle to see sync occur

## Notes

- Backward compatible with existing TodoList component
- All new types exported from `lib/db.ts`
- Service worker still handles precaching as configured
- Database version remains 1 (upgrade handler manages schema)
