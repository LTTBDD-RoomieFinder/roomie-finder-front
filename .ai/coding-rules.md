# Coding Rules

## 1. Deterministic Placement Rules
1. Place route screens only in `app/*` according to Expo Router structure.
2. Place raw HTTP endpoint functions only in `apis/*`.
3. Place business/domain orchestration only in `services/*`.
4. Place reusable UI controls in `components/ui/*`.
5. Place room-domain reusable components in `components/room/*`.
6. Place global shared state only in `stores/*` (Zustand).
7. Place persistence wrappers in `storage/*`.
8. Place payload contracts in `data/*` and domain models/enums in `types/*`.
9. Place constants/default mappings in `constants/*`.
10. Place pure stateless helper functions in `utils/*`.

## 2. Naming Conventions
1. Use kebab-case for file names (example: `room-form.tsx`, `room-service.ts`).
2. Use PascalCase for React components and TypeScript types/enums.
3. Use camelCase for variables, function names, and service/API object keys.
4. Keep enum values as uppercase snake case (existing pattern in `types/enums.ts`).

## 3. Import Conventions
1. Prefer alias imports with `@/` (configured in `tsconfig.json`).
2. Do not introduce deep relative imports when alias form is available.
3. Group imports in this order for consistency: external packages first, internal alias imports second.

## 4. Screen Component Rules
1. Use default export for route screen component files in `app/*`.
2. Keep screen responsibilities to UI interaction + orchestration.
3. Call `services/*` from screens; do not call `apis/*` directly from screens.
4. Keep screen loading/error flags in local state unless truly global.

## 5. Reusable Component Rules
1. Keep export style consistent with surrounding files in the same folder (current codebase uses both named and default exports).
2. Define explicit prop types near component declaration.
3. Keep reusable components feature-agnostic unless placed in feature folder (`components/room/*`).
4. Prefer composition via props and callbacks over hidden side effects.

## 6. Hook Rules
1. Prefix all custom hooks with `use`.
2. Keep hooks in `hooks/*` when reused across multiple features.
3. Keep hook outputs stable and explicit (objects with named keys are preferred in current code).

## 7. Service and API Rules
1. API modules return axios calls and contain endpoint path details.
2. Service modules are the interface consumed by screens/components.
3. Keep auth/session side effects inside services and store actions (not in API modules).
4. Reuse `config/axios.ts` for all backend API calls.

## 8. State Management Rules
1. Keep auth session in Zustand store (`stores/useAuthStore.ts`).
2. Persist tokens via `storage/token.ts` only.
3. Avoid duplicate token persistence logic in feature files.

## 9. Styling Rules
1. Use `StyleSheet.create(...)` as baseline styling pattern.
2. Use `useAppTheme()` or themed helpers for dynamic colors.
3. Reuse color tokens from `constants/theme.ts`; avoid ad-hoc color values unless intentional visual treatment.
4. Keep layout and spacing in styles; keep dynamic color overrides inline when theme-dependent.

## 10. Error Handling Rules
1. Wrap async screen/service operations with `try/catch`.
2. Surface user-facing errors using existing UI patterns (`FormError`, `alert`, `Alert.alert`) unless project-wide system is introduced.
3. Preserve interceptor-based auth error handling in `config/axios.ts`.

## 11. Type Safety Rules
1. Keep strict TypeScript compatibility.
2. Add or extend request/response/domain types before adding new API fields.
3. Avoid `any`; if temporarily necessary, constrain its scope and replace quickly.

## 12. Routing Rules
1. Follow Expo Router file naming conventions for dynamic routes (example: `[id].tsx`).
2. Keep route group boundaries explicit: `(auth)` for public flows, `(tabs)` for authenticated flows.
3. Update relevant `_layout.tsx` files when adding new screens to stacks/tabs.
