# Codex Implementation Prompt

## Role

Act as a senior full-stack engineer, lead software architect, privacy engineer, and PWA specialist.

Build a production-grade Progressive Web App named **WayPoint**.

WayPoint is a high-performance, privacy-centric location-sharing PWA where users can securely share their live location with trusted people through revocable access keys.

The application must be mobile-first, installable, responsive, secure, lightweight, and suitable for hosting on free-tier services.

---

# 1. Project Goal

Build a complete location-sharing PWA with:

- User authentication
- Location update/transmission
- Live map view using polling, not WebSocket
- Access-key-based sharing
- Revocable/mutable privacy controls
- Ghost mode
- Battery sharing toggle
- Mobile and desktop responsive UI
- Offline-friendly PWA behavior
- Secure API routes
- Neon Postgres database
- Drizzle ORM
- Auth.js authentication
- TanStack Query polling
- Leaflet map rendering

The app must avoid paid real-time infrastructure. Use polling and careful optimization.

---

# 2. Core Tech Stack

Use the following stack only unless technically unavoidable:

## Frontend

- Next.js 14+ with App Router
- React Server Components where suitable
- Client Components only where browser APIs are required
- TypeScript
- Tailwind CSS
- shadcn/ui where useful
- Lucide React icons
- Zustand for lightweight UI/map state
- TanStack Query for API caching, polling, retries, and synchronization
- Leaflet.js with React integration
- OpenStreetMap-compatible tile source

## Backend

- Next.js Route Handlers under `/app/api`
- Neon Postgres serverless database
- Drizzle ORM
- Drizzle migrations
- Auth.js / NextAuth
- Auth.js Postgres/Drizzle adapter
- Upstash Redis + `@upstash/ratelimit` for rate limiting

## PWA

- `next-pwa` or a clean Next.js-compatible PWA setup
- `manifest.json`
- Custom service worker where needed
- Offline fallback page
- Runtime caching for static assets
- Tile caching must respect cache headers and must not aggressively abuse public tile servers

---

# 3. Important Engineering Reality Constraints

Implement the app honestly according to browser limitations.

## Location Tracking Limitation

Do not pretend that a web PWA can reliably track location continuously in the background like a native Android/iOS app.

Implement location updates when:

- The app is open in the foreground
- The installed PWA is active
- The app is resumed
- The browser allows geolocation access
- The user explicitly enables tracking

Use polling/update intervals:

- Foreground: every 10 seconds
- Background or hidden tab: every 60 seconds where browser allows
- On app resume: immediately send one update
- On network recovery: retry queued update

Use the Page Visibility API and Network Information API where available.

## Battery API Limitation

The Battery Status API is not supported in all browsers.

Implementation rule:

- If battery API is available, send battery level.
- If unavailable, send `null`.
- Never break location update because battery data is unavailable.

---

# 4. Architecture Overview

Use this high-level structure:

```txt
app/
  api/
    auth/[...nextauth]/route.ts
    location/update/route.ts
    location/following/route.ts
    location/[connectionId]/route.ts
    keys/route.ts
    keys/[keyId]/route.ts
    connections/join/route.ts
    connections/route.ts
  dashboard/
    page.tsx
  map/
    page.tsx
  settings/
    page.tsx
components/
  map/
    WayPointMap.tsx
    MapErrorBoundary.tsx
    LocationMarker.tsx
  keys/
    KeyManager.tsx
    KeyCard.tsx
    CreateKeyDialog.tsx
  connections/
    FollowingList.tsx
    ConnectionCard.tsx
  location/
    LocationTransmitter.tsx
    TrackingStatus.tsx
  layout/
    AppShell.tsx
    MobileBottomNav.tsx
    DesktopSidebar.tsx
lib/
  auth.ts
  db/
    schema.ts
    index.ts
    migrations/
  location/
    getBrowserLocation.ts
    transmitter.ts
    battery.ts
  rate-limit.ts
  crypto.ts
  validators.ts
  query-client.ts
store/
  map-store.ts
  ui-store.ts
public/
  manifest.json
  icons/
```

---

# 5. Database Design

Use Drizzle ORM and Neon Postgres.

Create a schema that supports Auth.js and WayPoint business logic.

## Required Auth.js Tables

Implement the required Auth.js-compatible tables:

- `users`
- `accounts`
- `sessions`
- `verificationTokens`

The `users` table must also contain app-specific profile settings.

## `users`

Fields:

- `id` uuid primary key
- `name` text nullable
- `email` text unique not null
- `emailVerified` timestamp nullable
- `image` text nullable
- `globalGhostMode` boolean default false not null
- `shareBattery` boolean default false not null
- `allowLocationHistory` boolean default false not null
- `lastSeenAt` timestamp nullable
- `createdAt` timestamp default now not null
- `updatedAt` timestamp default now not null

## `location_current`

Stores only the latest location per user.

Fields:

- `userId` uuid primary key references users(id) on delete cascade
- `lat` double precision not null
- `lng` double precision not null
- `accuracy` double precision nullable
- `altitude` double precision nullable
- `heading` double precision nullable
- `speed` double precision nullable
- `batteryLevel` integer nullable
- `isCharging` boolean nullable
- `source` text default `browser-geolocation`
- `lastUpdated` timestamp default now not null

Indexes:

- primary key on `userId`
- index on `lastUpdated`

## `location_history`

Privacy-sensitive. Store only if `users.allowLocationHistory = true`.

Fields:

- `id` uuid primary key
- `userId` uuid references users(id) on delete cascade
- `lat` double precision not null
- `lng` double precision not null
- `accuracy` double precision nullable
- `batteryLevel` integer nullable
- `recordedAt` timestamp default now not null

Indexes:

- index on `userId`
- index on `recordedAt`
- compound index on `(userId, recordedAt)`

## `access_keys`

Represents a sharing key created by a user.

Important security rule:

Never store the raw share token. Generate a secure random token, show it once to the owner, and store only an HMAC/SHA-256 hash.

Fields:

- `id` uuid primary key
- `ownerId` uuid references users(id) on delete cascade
- `keyLabel` text not null
- `tokenHash` text unique not null
- `isActive` boolean default true not null
- `isMuted` boolean default false not null
- `expiresAt` timestamp nullable
- `lastUsedAt` timestamp nullable
- `createdAt` timestamp default now not null
- `updatedAt` timestamp default now not null

Indexes:

- index on `ownerId`
- unique index on `tokenHash`
- compound index on `(ownerId, isActive)`

## `connections`

Represents a follower who has joined another user’s access key.

Fields:

- `id` uuid primary key
- `followerId` uuid references users(id) on delete cascade
- `ownerId` uuid references users(id) on delete cascade
- `accessKeyId` uuid references access_keys(id) on delete cascade
- `status` text default `active`
- `grantedAt` timestamp default now not null
- `revokedAt` timestamp nullable

Constraints:

- unique `(followerId, accessKeyId)`

Indexes:

- index on `followerId`
- index on `ownerId`
- index on `accessKeyId`
- compound index on `(followerId, status)`

Allowed `status` values:

- `active`
- `revoked`
- `blocked`

---

# 6. Privacy and Access Rules

Privacy logic must be enforced on the server, not only in the frontend.

## Ghost Mode

If `users.globalGhostMode = true`:

- `/api/location/update` must still accept location updates.
- `/api/location/following` must not expose this user’s live location to followers.
- `/api/location/[connectionId]` must return `location: null`.
- Response should include a safe status such as `hiddenByPrivacy`.

## Muted Key

If `access_keys.isMuted = true`:

- Followers connected through that key must not receive location.
- Return `location: null`.
- Include status `muted`.

## Inactive Key

If `access_keys.isActive = false`:

- New users cannot join using that key.
- Existing followers cannot fetch location through that key.
- Return 403 or safe null payload depending on endpoint context.

## Expired Key

If `expiresAt` is not null and is in the past:

- Treat as inactive.
- New joins denied.
- Existing followers denied.

## Battery Sharing

If `users.shareBattery = false`:

- Do not return battery data to followers.
- Return `batteryLevel: null`.
- Return `isCharging: null`.

## Location History

Default behavior:

- Store only the latest location.
- Do not store history unless the user enables `allowLocationHistory`.

---

# 7. API Design

All API routes must:

- Use TypeScript
- Validate input with Zod
- Require authenticated session where appropriate
- Use server-side permission checks
- Return consistent JSON
- Use proper HTTP status codes
- Use rate limiting on mutation routes
- Avoid leaking private user data

---

## `POST /api/location/update`

Purpose:

Current user sends latest location.

Auth:

- Required

Request body:

```json
{
  "lat": 23.8103,
  "lng": 90.4125,
  "accuracy": 12,
  "altitude": null,
  "heading": null,
  "speed": null,
  "batteryLevel": 87,
  "isCharging": false
}
```

Validation:

- `lat` must be between -90 and 90
- `lng` must be between -180 and 180
- `batteryLevel` must be 0 to 100 or null
- Ignore impossible values safely

Behavior:

- Rate limit per user
- Upsert into `location_current`
- Update `users.lastSeenAt`
- If `allowLocationHistory = true`, insert into `location_history`
- Return success

Response:

```json
{
  "ok": true,
  "lastUpdated": "ISO_DATE"
}
```

Failure handling:

- 401 if unauthenticated
- 400 if invalid payload
- 429 if rate limited
- 500 with safe error message

---

## `GET /api/location/following`

Purpose:

Return all active people the current user is allowed to follow.

Auth:

- Required

Behavior:

- Fetch active connections for current user
- Join access key
- Join owner user
- Join current location
- Apply privacy firewall:
  - ghost mode
  - muted key
  - inactive key
  - expired key
  - revoked connection
  - battery visibility

Response example:

```json
{
  "items": [
    {
      "connectionId": "uuid",
      "owner": {
        "id": "uuid",
        "name": "John",
        "image": null
      },
      "accessKey": {
        "label": "For Mom"
      },
      "location": {
        "lat": 23.8103,
        "lng": 90.4125,
        "accuracy": 12,
        "lastUpdated": "ISO_DATE"
      },
      "battery": {
        "batteryLevel": 87,
        "isCharging": false
      },
      "status": "active"
    }
  ]
}
```

If hidden:

```json
{
  "connectionId": "uuid",
  "location": null,
  "battery": null,
  "status": "hiddenByPrivacy"
}
```

---

## `GET /api/location/[connectionId]`

Purpose:

Fetch a single connection’s location.

Auth:

- Required

Rules:

- Current user must be the follower on that connection.
- Apply all privacy rules.
- Return only the allowed owner’s current location.

---

## `POST /api/keys`

Purpose:

Create a new access key.

Auth:

- Required

Request body:

```json
{
  "keyLabel": "For Mom",
  "expiresAt": null
}
```

Behavior:

- Generate secure random token
- Hash token using HMAC/SHA-256 with `ACCESS_KEY_SECRET`
- Store hash only
- Return raw token once
- Return share link once

Response:

```json
{
  "id": "uuid",
  "keyLabel": "For Mom",
  "shareToken": "raw-token-visible-once",
  "shareUrl": "https://app-domain.com/join/raw-token-visible-once"
}
```

---

## `GET /api/keys`

Purpose:

List current user’s keys.

Do not return raw token or token hash.

---

## `PATCH /api/keys/[keyId]`

Purpose:

Update key label, mute state, active state, or expiry.

Allowed updates:

```json
{
  "keyLabel": "For Family",
  "isActive": true,
  "isMuted": false,
  "expiresAt": null
}
```

Rules:

- Only owner can update.
- Validate all fields.
- Partial update allowed.

---

## `DELETE /api/keys/[keyId]`

Purpose:

Deactivate or delete a key.

Preferred behavior:

- Soft deactivate by setting `isActive = false`.
- Do not physically delete unless necessary.

---

## `POST /api/connections/join`

Purpose:

Follower joins using a share token.

Auth:

- Required

Request body:

```json
{
  "shareToken": "raw-token"
}
```

Behavior:

- Hash token using same HMAC/SHA-256 method
- Find matching active key
- Reject if expired, muted, inactive, or owned by same user
- Create connection
- If connection already exists and is active, return existing connection
- If revoked, allow reactivation only if not blocked

Response:

```json
{
  "ok": true,
  "connectionId": "uuid"
}
```

---

## `GET /api/connections`

Purpose:

List people current user follows and people following current user.

Return:

```json
{
  "following": [],
  "followers": []
}
```

---

# 8. Location Transmitter Logic

Create a client-only component:

```txt
components/location/LocationTransmitter.tsx
```

Responsibilities:

- Ask for location permission only after user action
- Track permission state
- Use `navigator.geolocation.getCurrentPosition`
- Optionally use `watchPosition` while app is foregrounded
- Send location to `/api/location/update`
- Use interval-based update:
  - 10 seconds foreground
  - 60 seconds hidden/background where allowed
- Send immediately on:
  - app open
  - app resume
  - network reconnect
  - visibility change from hidden to visible
- Use exponential backoff for failures:
  - 5s
  - 10s
  - 20s
  - 40s
  - max 60s
- Stop aggressive retry on 401, 403, or permission denied
- Show tracking state in UI

States:

- `idle`
- `requestingPermission`
- `tracking`
- `permissionDenied`
- `offline`
- `syncing`
- `error`

Do not crash if geolocation is unavailable.

---

# 9. Map Logic

Create:

```txt
components/map/WayPointMap.tsx
components/map/MapErrorBoundary.tsx
components/map/LocationMarker.tsx
store/map-store.ts
```

Map requirements:

- Use Leaflet
- Disable SSR for the Leaflet map component
- Use dynamic import with `ssr: false`
- Wrap map with error boundary
- Show fallback UI if map fails
- Use Zustand for:
  - map center
  - zoom
  - selected connection
  - sidebar state
- Use TanStack Query polling:
  - Fetch following list every 10 seconds in foreground
  - Fetch every 60 seconds in background
  - Pause polling when offline
- Show stale location warning when `lastUpdated` is older than 5 minutes
- Show offline/hidden/muted status clearly

Map UI:

- Active users shown with pulsing marker
- Stale users shown with inactive marker
- Hidden users listed but without coordinates
- Clicking a user centers the map on their location
- Current user location may be shown separately if permission is granted

---

# 10. UI/UX Requirements

Design style:

- Clean
- Modern
- High contrast
- Mobile-first
- Minimal but polished
- Use Tailwind CSS
- Use Lucide icons
- Use accessible labels and keyboard-friendly controls

## Mobile Layout

- Full-screen map
- Bottom navigation
- Bottom sheet for:
  - following list
  - key management
  - settings
- Large touch targets
- Sticky tracking status indicator

## Desktop Layout

- Persistent left sidebar
- Map on the right
- Sidebar sections:
  - Tracking status
  - Following
  - My Access Keys
  - Privacy settings

## Loading States

Use:

- Skeleton loaders for following list
- Skeleton cards for key list
- Pulsing dot for active tracking
- Toast notifications for success/failure

## Empty States

Provide empty states for:

- No keys created
- No followers
- No following connections
- Location permission denied
- Browser does not support geolocation
- User is offline

---

# 11. Key Manager

Build CRUD UI for access keys.

Features:

- Create key with label
- Copy one-time share link
- Show warning that token is visible only once
- Rename key
- Mute/unmute key
- Activate/deactivate key
- Optional expiry date
- Show follower count per key
- Show last used time
- Confirm destructive actions

Privacy behavior:

- Muting key hides location from followers immediately.
- Deactivating key prevents future and existing access.
- Ghost mode overrides all keys.

---

# 12. Settings Page

Create profile/privacy settings:

- Ghost mode toggle
- Battery sharing toggle
- Location history toggle
- Tracking enabled/disabled
- Permission status display
- Clear local cache button
- Sign out button

Rules:

- Settings must persist to database.
- Use optimistic UI only where safe.
- Revalidate after mutation.

---

# 13. Authentication

Use Auth.js.

Support at minimum:

- Email provider or OAuth provider based on available environment variables
- Auth.js database sessions
- Protected dashboard routes
- Redirect unauthenticated users to sign-in page

Middleware:

- Protect `/dashboard`
- Protect `/map`
- Protect `/settings`
- Protect API routes server-side through session validation

Do not rely only on middleware for API protection.

---

# 14. PWA Requirements

Create proper PWA setup.

## Manifest

Include:

- name: `WayPoint`
- short_name: `WayPoint`
- description
- start_url
- display: `standalone`
- theme_color
- background_color
- icons:
  - 192x192
  - 512x512
  - maskable icon

## Service Worker

Implement:

- Cache static assets
- Offline fallback page
- Runtime caching for app shell
- Respect tile server cache headers
- Do not cache authenticated API responses globally
- Do not expose private location data in shared cache

## Offline Behavior

When offline:

- Show offline banner
- Pause polling
- Store latest unsent location update in local storage or IndexedDB
- On reconnect, send only the latest queued location update
- Do not queue unlimited location history by default

---

# 15. Rate Limiting

Implement Upstash rate limiting.

Apply to:

- `POST /api/location/update`
- `POST /api/keys`
- `POST /api/connections/join`

Suggested limits:

- Location update: 10 requests per minute per user
- Key creation: 10 keys per hour per user
- Join attempts: 20 attempts per hour per user/IP

Use graceful 429 responses:

```json
{
  "ok": false,
  "error": "Rate limit exceeded. Try again later."
}
```

---

# 16. Security Requirements

Implement the following:

- Server-side auth checks on all protected APIs
- Zod validation for every request body
- Never store raw access tokens
- Never return token hashes
- Never expose Neon connection string to client
- Strict separation of `NEXT_PUBLIC_*` and server-only env vars
- Use HMAC/SHA-256 for share token hashing
- Use secure random token generation
- Prevent users from following themselves
- Prevent unauthorized connection access
- Soft-delete or deactivate access keys instead of unsafe hard delete
- Avoid logging raw coordinates in production logs
- Avoid logging raw access tokens
- Sanitize user-generated labels
- Use proper HTTP codes

---

# 17. Environment Variables

Create `.env.example`:

```env
DATABASE_URL=

AUTH_SECRET=
AUTH_URL=http://localhost:3000

ACCESS_KEY_SECRET=

UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_MAP_TILE_URL=https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png
```

Rules:

- `DATABASE_URL`, `AUTH_SECRET`, `ACCESS_KEY_SECRET`, and Upstash secrets must never be exposed to the browser.
- Only public configuration should use `NEXT_PUBLIC_*`.

---

# 18. Neon Free Tier Stability

Neon may suspend after inactivity.

Implement database access with:

- Reasonable retry logic for first failed connection
- Graceful timeout handling
- Safe error messages
- No infinite retry loops

For location update:

- Client should tolerate first request taking longer.
- Client should retry with exponential backoff if server returns 500.
- Use a generous initial timeout around 15–20 seconds.

Optional warm-up:

- On authenticated app load, call a lightweight endpoint such as `/api/health/db`.
- This endpoint should run a minimal query like `select 1`.
- Do not expose sensitive DB details.

---

# 19. Error Handling

Implement:

- Global error boundary
- Map-specific error boundary
- API error helpers
- Toast notifications
- Safe fallback UI

Frontend must handle:

- Location permission denied
- Geolocation unavailable
- Network offline
- Server 429
- Server 500
- Map tile loading failure
- No active connections
- Ghost mode enabled
- Muted key
- Stale location

---

# 20. Testing Requirements

Add practical tests where possible.

At minimum:

- Unit test token hashing helper
- Unit test privacy firewall logic
- Unit test location payload validation
- API route tests if project setup supports it
- Basic component tests for key manager and settings toggles

Create a privacy firewall helper function:

```ts
resolveLocationVisibility({
  owner,
  accessKey,
  connection,
  location
})
```

It should return:

```ts
{
  canView: boolean;
  status:
    | "active"
    | "hiddenByPrivacy"
    | "muted"
    | "inactiveKey"
    | "expiredKey"
    | "revoked"
    | "noLocation";
}
```

Test this heavily.

---

# 21. Implementation Phases

Work in phases. Keep code clean and incremental.

## Phase 1: Project Setup

- Create Next.js app
- Configure TypeScript
- Configure Tailwind
- Configure shadcn/ui if needed
- Configure Drizzle
- Configure Neon
- Create schema
- Add migrations
- Add `.env.example`

## Phase 2: Authentication

- Configure Auth.js
- Add database adapter
- Add protected routes
- Add sign-in/sign-out flow
- Add session helper

## Phase 3: Database and Core API

Begin by generating:

1. Drizzle schema
2. Database connection helper
3. Auth helper
4. `/api/location/update` route

Then implement:

- `/api/keys`
- `/api/keys/[keyId]`
- `/api/connections/join`
- `/api/location/following`
- `/api/location/[connectionId]`

## Phase 4: Location Transmitter

- Browser geolocation helper
- Battery helper
- Tracking component
- Exponential backoff
- Foreground/background interval logic
- Offline queue for latest location only

## Phase 5: Map View

- Leaflet setup
- Dynamic import
- Error boundary
- Zustand map state
- Following list polling
- Markers
- Stale location handling

## Phase 6: Key Manager and Settings

- Key CRUD UI
- Copy share link
- Mute/unmute
- Activate/deactivate
- Ghost mode toggle
- Battery sharing toggle
- Location history toggle

## Phase 7: PWA

- Manifest
- Icons
- Service worker
- Offline page
- App install prompt
- Runtime caching

## Phase 8: Polish and Stability

- Loading states
- Empty states
- Toasts
- Responsive layout
- Tests
- Security review
- Final cleanup

---

# 22. First Task

Start implementation by generating:

1. `lib/db/schema.ts`
2. `lib/db/index.ts`
3. `lib/auth.ts`
4. `lib/validators.ts`
5. `lib/rate-limit.ts`
6. `lib/crypto.ts`
7. `app/api/location/update/route.ts`
8. `.env.example`

The first generated code must be production-oriented, typed, validated, and aligned with all requirements above.

---

# 23. Coding Standards

Follow these rules:

- Use TypeScript strictly
- Avoid `any`
- Prefer small reusable functions
- Keep business logic out of React components
- Keep API permission checks server-side
- Use clear file names
- Use clean folder structure
- Avoid unnecessary dependencies
- Avoid overengineering
- Keep code readable
- Add comments only where they clarify non-obvious logic
- Do not modify unrelated files
- Do not skip validation
- Do not hardcode secrets
- Do not expose private data
- Do not store raw share tokens
- Do not claim impossible background tracking support

---

# 24. Acceptance Criteria

The implementation is complete when:

- A user can sign in
- A user can enable location tracking
- The app updates current location periodically while active
- A user can create a share key
- Another user can join using the share key
- The follower can see the owner’s location on the map
- Ghost mode hides location immediately
- Muting a key hides location immediately
- Deactivating a key blocks access
- Battery is shown only if enabled
- The app works on mobile, tablet, and desktop
- The app can be installed as a PWA
- Offline state is handled gracefully
- API routes are protected and validated
- Rate limiting works
- Neon connection failures are handled gracefully
- No raw share token is stored in the database
- No sensitive environment variable is exposed to the client

---

# 25. Final Senior Engineering Correction

Do not implement unlimited background tracking.

Browser PWAs cannot reliably run continuous geolocation in the background across Android/iOS.

Implement:

- Foreground tracking
- App resume sync
- Offline latest-location queue
- Network reconnect sync
- Honest tracking status UI
- Clear permission-denied state
- No false claim of native-level background tracking
