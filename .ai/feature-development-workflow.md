# Feature Development Workflow

This workflow reflects the current architecture in this repository.

## 1. Define the Feature Contract
1. Add or update domain types in `types/*`.
2. Add request/response payload types in `data/request.ts` and `data/response.ts` when needed.
3. Add enum labels/constants in `constants/*` if UI mapping is required.

## 2. Create API Layer
1. Create or extend `apis/<feature>-api.ts`.
2. Add endpoint functions that call `axiosRequest`.
3. Keep functions minimal: just path + payload + method.

## 3. Create Service Layer
1. Create or extend `services/<feature>-service.ts`.
2. Call API layer functions from service methods.
3. Return normalized output needed by screens/components.
4. Keep auth/session side effects in service/store only when feature requires it.

## 4. Build or Reuse Components
1. Reuse existing UI components if possible.
2. Add reusable generic UI to `components/ui/*`.
3. Add domain-specific reusable components to `components/<feature>/*`.
4. Keep component props typed and callback-driven.

## 5. Create Screen(s)
1. Add route file under `app/*` according to route group.
2. Manage screen state (`loading`, form values, refresh) with local hooks.
3. Trigger service methods in effects/handlers.
4. Show success/error feedback using current app patterns.

## 6. Wire Navigation
1. Add stack/tab entries in relevant `_layout.tsx` files.
2. Use `router.push`, `router.replace`, or `router.back` for transitions.
3. For protected routes, keep behavior compatible with root auth redirects.

## 7. Handle State Correctly
1. Use Zustand only for truly app-wide state.
2. Keep feature-scoped list/detail/form state local unless multiple screens must share it.
3. Do not duplicate token or auth state outside `useAuthStore`.

## 8. Validate Feature End-to-End
1. Run lint: `npm run lint`.
2. Verify route entry, data fetch, mutation flow, and error path manually.
3. Confirm auth-protected behavior if feature is inside `(tabs)` group.

## 9. Practical Checklist for AI Agents
1. Types updated first.
2. API file created/updated.
3. Service file created/updated.
4. Screen/component files implemented.
5. Navigation layout updated.
6. Imports use `@/` alias.
7. Lint passes.
