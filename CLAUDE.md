# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository structure

```
familysync/
├── mobile/          # React Native / Expo app
│   └── src/
│       ├── api/           # ApiClient singleton (REST calls + token mgmt)
│       ├── components/    # Shared UI components
│       ├── context/       # FamilyContext (global state), TabBarContext
│       ├── domain/        # Pure business logic (no React):
│       │   ├── gamification/  GamificationService.js
│       │   ├── notifications/ SmartNotificationPlanner.js
│       │   ├── analytics/     FamilyAnalyticsService.js
│       │   ├── access/        FamilyAccessPolicy.js
│       │   └── smartAssignment/
│       ├── navigation/    # RootNavigator (Stack) + MainTabs (BottomTab) + GlassTabBar
│       ├── screens/       # One file per screen
│       └── theme.js       # colors, spacing, typography, radius, shadows
└── server/          # Node.js / Express API
    └── src/
        ├── db/
        │   ├── index.js       # pg Pool (auto-SSL for Supabase URLs)
        │   ├── migrate.js     # Creates core tables
        │   ├── create-rewards.js
        │   ├── create-messages.js
        │   ├── create-family-messages.js
        │   └── add-*.js       # Additive schema migrations
        ├── middleware/auth.js  # JWT verification → req.user
        └── routes/            # auth, family, task, reward, notification, message
```

## Development commands

### Server
```bash
cd server
npm install
cp .env.example .env          # set DATABASE_URL and JWT_SECRET
npm run db:migrate            # create core tables
npm run db:rewards            # create rewards + reward_claims tables
npm run db:task-messages      # create task_messages table
npm run db:family-messages    # create family_messages table
npm run dev                   # nodemon, hot-reload on :3000
npm start                     # production
```

Required `.env` keys:
```
DATABASE_URL=postgresql://user:pass@host/familysync
JWT_SECRET=<any long secret>
PORT=3000   # optional, defaults to 3000
```

### Mobile
```bash
cd mobile
npm install
npm start           # Expo dev server (scan QR with Expo Go)
npm run android     # Android emulator
npm run ios         # iOS simulator (Mac only)
```

The app auto-detects the backend host from Expo's `hostUri` (same LAN). Override with `EXPO_PUBLIC_API_URL=http://<host>:3000/api` in `mobile/.env`.

## Architecture

### Authentication flow
- `ApiClient.ensureSession()` runs on app boot: validates stored JWT via `GET /auth/me`, or auto-registers/logs in with a locally generated identity stored in AsyncStorage. No manual login screen.
- JWT tokens expire in 30 days. `authMiddleware` attaches `req.user = { userId, email }`.

### Global state (mobile)
`FamilyContext` is the single source of truth. It owns:
- `user` (auth), `family` (first family in list), `members`, `tasks`, `notifications`
- `isParent` / `isChild` derived from `currentMembership.role`
- `refresh()` invalidates all react-query caches at once

All screens read from this context; mutations call `apiClient` directly and then `refresh()` or `queryClient.invalidateQueries(...)`.

### Navigation
`RootNavigator` switches between two stacks based on `hasFamily`:
- **Onboarding stack**: Welcome → Onboarding
- **Main stack**: MainTabs (5-tab bottom nav) + modal screens (TaskDetail, TaskDiscussion, Analytics)

### Role-based access
Three roles: `parent`, `grandparent`, `child`. On the backend every mutating endpoint checks membership and role. Key rules:
- Only `parent`/`grandparent` can create tasks and rewards, approve claims
- Only `child` can be assigned tasks, claim/redeem rewards
- Quest participants must all be children

### Task / Quest model
A task becomes a quest when `is_quest = true`. Quests have:
- `min_participants` — number of completions needed to auto-complete the quest
- `reward_multiplier` (≥ 1.0) — multiplies `points_reward` for all participants
- `quest_participants` table — tracks per-user completion status
- `POST /api/tasks/:id/participants/complete` — marks current user done; when `completedCount >= min_participants` the quest auto-completes and `awardQuestParticipants()` fires

### Gamification (client-side logic)
`GamificationService.js` is pure JS (no React), used in the Profile screen and analytics:
- 5 level tiers: Новичок → Ответственный → Мастер порядка → Гуру порядка → Легенда семьи
- XP formula: base (priority-based) × streak multiplier (max +25%) + on-time bonus (+5 XP)
- 4 achievements defined as predicate functions in `ACHIEVEMENTS`
- Level on the backend is simpler: `FLOOR(points / 100) + 1`

### Smart notifications
`SmartNotificationWorker` (rendered in `App.js`, returns null) runs `createSmartNotificationScheduler` every 90 seconds. Pure notification-planning logic lives in `SmartNotificationPlanner.js` (no Expo Push, no device tokens). Notifications are written to the `notifications` DB table via API and displayed in `NotificationsScreen`.

### Chat polling
Both `FamilyChatScreen` (family-wide) and `TaskChat` (per-task) use react-query `refetchInterval` (3500 ms). No WebSocket.

### Database schema key points
- `family_members.points`, `level`, `tasks_completed`, `achievements_json` (JSON string array of achievement IDs) live on the membership row, not the user row — stats are per-family
- `rewards` has `type` (item | artifact | privilege) and `rarity` (common | rare | epic | legendary). Artifacts have `duration_hours` and get `active_until` stamped on claim
- All tables use `SERIAL PRIMARY KEY`; foreign keys on `user_email` (string), not `user_id`

### DB connection
`server/src/db/index.js` uses a single `pg.Pool`. SSL is auto-enabled when `DATABASE_URL` contains `supabase.com`.

## Key conventions
- Server uses ES Modules (`"type": "module"`) — use `import/export`, not `require`
- All API routes are under `/api/<resource>`; the auth middleware is opt-in per router
- Mobile theme values (colors, spacing, radius, shadows, typography) all come from `mobile/src/theme.js` — do not hardcode style values inline
- `domain/` files are pure functions with no React imports — keep them that way
