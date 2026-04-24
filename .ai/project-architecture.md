# Project Architecture

## 1. Folder Structure (Current)

```text
app/                  # Expo Router screens and layouts
apis/                 # Raw API endpoint wrappers (axiosRequest)
services/             # Service layer used by screens/components
components/           # Reusable UI and domain components
stores/               # Zustand global store(s)
storage/              # Secure token persistence
hooks/                # Theme and utility hooks
data/                 # Request/response payload types
types/                # Domain models and enums
constants/            # Theme, labels, token keys, defaults
config/               # Axios instance and interceptors
utils/                # Pure formatting/helper functions
```

## 2. Navigation Architecture

### 2.1 Root Routing
- `app/_layout.tsx` initializes auth state and performs redirects.
- Route groups: `/(auth)` for unauthenticated flows, `/(tabs)` for authenticated app shell.

### 2.2 Auth Group
- `app/(auth)/login.tsx`
- `app/(auth)/register.tsx`
- `app/(auth)/forgot-password.tsx`
- group layout: `app/(auth)/_layout.tsx` with hidden headers.

### 2.3 Main Tabs
- configured in `app/(tabs)/_layout.tsx`
- tabs: `home`, `room`, `profile`

### 2.4 Room Sub-Navigation
- `app/(tabs)/room/index.tsx` (list)
- `app/(tabs)/room/new.tsx` (create)
- `app/(tabs)/room/[id].tsx` (detail)
- `app/(tabs)/room/edit.tsx` (edit)
- stack in `app/(tabs)/room/_layout.tsx`

## 3. Data Flow

### 3.1 Standard Flow
1. Screen triggers event (submit/fetch/delete).
2. Screen calls service method from `services/*`.
3. Service calls API method from `apis/*`.
4. API method calls shared axios instance (`config/axios.ts`).
5. Axios interceptor injects token and handles refresh logic.
6. Response data is returned back to service and then screen.

### 3.2 Auth Flow
1. App start -> `useAuthStore.initialize()` in `app/_layout.tsx`.
2. Tokens loaded from secure storage (`storage/token.ts`).
3. `isAuthenticated` computed in store.
4. Root layout redirects user to auth or tabs group.

### 3.3 Token Refresh Flow
1. Any request `401` triggers interceptor branch.
2. One refresh request is performed (`/auth/refresh`).
3. Pending requests subscribe and retry once new token is available.
4. Refresh failure clears tokens and logs out store state.

## 4. API Structure

### 4.1 Endpoint Modules
- `apis/auth.ts`
- `apis/room-api.ts`
- `apis/location-api.ts`
- `apis/amenity-api.ts`

### 4.2 Service Modules
- `services/auth.ts`
- `services/room-service.ts`
- `services/location-service.ts`
- `services/amenity-service.ts`
- `services/image-service.ts`

### 4.3 Typing Contract Placement
- requests: `data/request.ts`
- responses: `data/response.ts`
- domain enums/models: `types/*`

## 5. Component Architecture

### 5.1 Shared UI Layer
- `components/ui/*`: reusable controls (`password-input`, `form-error`, `form-section`, `location-picker`, etc.)

### 5.2 Domain Components
- `components/room/*`: room-specific reusable pieces (`room-card`, `room-form`, `amenities-chip-list`)

### 5.3 Theming Components
- `components/themed-text.tsx`
- `components/themed-view.tsx`
- theme hook: `hooks/use-app-theme.ts`

## 6. State Architecture

### 6.1 Global State
- Zustand auth store in `stores/useAuthStore.ts`
- includes user/token/auth flags and actions (`initialize`, `setSession`, `logout`)

### 6.2 Local Screen State
- list data, loading flags, and form state are primarily local `useState` in screens/components.

## 7. Styling Architecture
- Primary pattern: `StyleSheet.create(...)` + inline dynamic theme values.
- Theme tokens from `constants/theme.ts`.
- App-level theme helper from `hooks/use-app-theme.ts`.
- NativeWind package is installed but not dominant in current implementation files.
