# Tasks PWA - Offline Support Project

## Project Overview

This is a Next.js 16 Progressive Web App (PWA) for task management with **true offline support**. Users can add, edit, delete, and complete tasks even without an internet connection. Changes are automatically synced when the device comes back online.

## Project Structure

```
tasks-pwa/
├── app/
│   ├── sw.ts              # Service worker configuration (Serwist)
│   ├── manifest.ts        # PWA manifest file
│   ├── layout.tsx         # Root layout with OnlineStatus component
│   ├── page.tsx           # Home page (renders TodoList)
│   └── globals.css        # Global styles
├── components/
│   ├── TodoList.tsx       # Main task list component (client-side)
│   └── OnlineStatus.tsx   # Offline indicator banner
├── lib/
│   ├── db.ts              # IndexedDB operations (add, get, update, delete todos)
│   └── sync.ts            # Sync logic for when device comes back online
├── public/
│   └── icons/
│       ├── icon-192x192.svg    # App icon (small)
│       └── icon-512x512.svg    # App icon (large)
├── next.config.ts         # Next.js & Serwist configuration
├── package.json           # Dependencies and scripts
└── tsconfig.json          # TypeScript configuration
```

## Key Features

### 1. **Service Worker (Serwist)**
- Located in `app/sw.ts`
- Handles precaching of app shell (HTML, CSS, JS)
- Implements stale-while-revalidate strategy for assets
- Automatically generated to `public/sw.js` during build

### 2. **Local Storage (IndexedDB)**
- Defined in `lib/db.ts`
- Stores todos locally with full ACID support
- Async operations don't block the UI
- Tracks sync status for each todo

### 3. **Sync Logic**
- Located in `lib/sync.ts`
- Auto-syncs when device comes back online
- Only syncs todos marked as `synced: false`
- Integrates with native `window.addEventListener('online')`

### 4. **UI Components**
- **TodoList.tsx**: Main app with add/edit/delete/complete functionality
- **OnlineStatus.tsx**: Shows banner when offline
- Styled with Tailwind CSS for responsive design

### 5. **PWA Configuration**
- Manifest file (`app/manifest.ts`) defines app name, icons, and display mode
- Standalone display mode (looks like native app)
- Theme color matching app design

## Build & Deployment

The project uses **Webpack** for builds (not Turbopack) because Serwist requires it:

```bash
npm run build    # Builds with webpack, generates service worker
npm run start    # Starts production server
npm run dev      # Dev mode (turbopack, no caching)
```

## Testing Offline Mode

1. Build and start the app: `npm run build && npm start`
2. Navigate to http://localhost:3000
3. Open Chrome DevTools (F12)
4. Go to the Network tab → Throttling dropdown → Select "Offline"
5. Add, complete, and delete tasks - everything works!
6. Uncheck "Offline" and watch tasks sync (console shows sync logs)

## What Works Offline

✅ Add new tasks  
✅ Mark tasks as complete  
✅ Delete tasks  
✅ View all existing tasks  
✅ See a "Pending" badge on unsynced tasks  
✅ See offline indicator banner  

## Important Notes

- **HTTPS Required**: PWAs must be served over HTTPS in production (localhost is exempt for development)
- **iOS Limitations**: On iOS, PWA features require adding app to home screen
- **Sync Strategy**: Currently marks todos as synced locally; connect to a real API in the comments of `lib/sync.ts`
- **API Integration**: Uncomment the fetch call in `lib/sync.ts` to sync with your backend

## Next Steps (Optional)

1. **Connect to Backend API**: Replace the comment in `lib/sync.ts` with real fetch calls
2. **Conflict Resolution**: Add logic to handle conflicting edits on multiple devices
3. **Background Sync API**: Use instead of window.online listener for better reliability
4. **Push Notifications**: Notify users when syncs complete or new data arrives
5. **Deploy**: Use Vercel, Netlify, or any HTTPS-capable hosting

## Key Dependencies

- **next**: React framework with App Router
- **@serwist/next**: PWA service worker generation
- **idb**: Type-safe IndexedDB wrapper
- **tailwindcss**: Utility-first CSS framework

---

Ready to move into the project folder and start developing!
