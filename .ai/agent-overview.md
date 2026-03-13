# Agent Overview

## Project Purpose
Roomie Finder Frontend is an Expo + React Native application for rental listing workflows:
- authenticate users
- create/update/delete room listings
- manage room details (price, area, capacity, address, amenities, images)

This repository is structured around Expo Router file-based routes in `app/`, not a traditional `src/screens` + `navigation` split.

## Verified Tech Stack
- Runtime: React 19 + React Native 0.81
- App framework: Expo SDK 54
- Routing: `expo-router` (file-based)
- Language: TypeScript (`strict: true`)
- State management: Zustand (`stores/useAuthStore.ts`)
- HTTP client: Axios (`config/axios.ts`)
- Token persistence: `expo-secure-store` (`storage/token.ts`)
- UI: React Native `StyleSheet` + themed wrappers (`ThemedText`, `ThemedView`, `useAppTheme`)
- Optional styling dependency present: NativeWind (installed, not primary styling pattern in current code)

## High-Level Architecture
Current layering is:
1. `app/*` route screens (UI + screen-level state)
2. `components/*` reusable UI/domain components
3. `services/*` business-level wrappers for API calls
4. `apis/*` raw endpoint methods using shared Axios instance
5. `config/axios.ts` transport concerns (auth header, refresh token handling)
6. `stores/*` global state (currently auth-focused)
7. `types/*` and `data/*` shared typing contracts

## Navigation Model
- Root layout: `app/_layout.tsx`
- Auth group: `app/(auth)/*`
- Main tabs group: `app/(tabs)/*`
- Room feature nested group: `app/(tabs)/room/*`

Auth gating is handled in root layout by checking Zustand auth state and redirecting with `router.replace(...)`.

## Core Feature Modules Today
- Auth: `app/(auth)/*`, `services/auth.ts`, `apis/auth.ts`
- Room CRUD: `app/(tabs)/room/*`, `components/room/*`, `services/room-service.ts`, `apis/room-api.ts`
- Location hierarchy (city/district/ward): `services/location-service.ts`, `apis/location-api.ts`
- Amenities: `services/amenity-service.ts`, `apis/amenity-api.ts`
- Image upload: `services/image-service.ts`

## What AI Agents Should Optimize For
- Follow existing folder placement conventions exactly.
- Reuse `@/` import aliases.
- Add new API calls in `apis/*`, not directly in screens.
- Use service layer as screen-facing boundary.
- Keep auth token behavior compatible with existing Axios interceptors.
- Keep TypeScript types explicit and aligned with `data/request.ts`, `data/response.ts`, and `types/*`.

## Non-Goals (Current Repo)
- No React Query/SWR layer currently.
- No Redux/MobX architecture currently.
- No centralized error boundary or toast system currently.
- No formal test suite in repository currently.
