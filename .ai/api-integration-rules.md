# API Integration Rules

## 1. Layer Boundaries (Mandatory)
1. `apis/*` owns endpoint definitions and direct axios calls.
2. `services/*` owns business orchestration and is the entry point for screens/components.
3. `app/*` screens and `components/*` must not call `axiosRequest` directly.

## 2. HTTP Client Usage
1. Use only shared client from `config/axios.ts` for backend API requests.
2. Do not create ad-hoc axios clients in feature files.
3. Respect existing timeout and query serialization behavior.

## 3. Authentication and Token Rules
1. Access token injection is handled by request interceptor.
2. Token refresh handling is centralized in response interceptor.
3. Never duplicate refresh-token retry logic in feature code.
4. Persist and clear tokens only through `storage/token.ts`.

## 4. Endpoint Definition Rules (`apis/*`)
1. Keep functions thin and declarative: define method, path, and payload/params only.
2. Use typed request payloads from `data/request.ts`.
3. Avoid UI-side effects in API modules.

## 5. Service Definition Rules (`services/*`)
1. Wrap API calls in async methods.
2. Return the data shape expected by screen/component callers.
3. Handle feature-specific transformation in service layer when necessary.
4. Keep cross-cutting side effects (for example auth session update) in service/store, not UI.

## 6. Response Handling Rules
1. Assume interceptor returns `response.data` for successful requests.
2. Handle `.data` access consistently based on current backend payload structure.
3. Avoid silently swallowing errors; either rethrow or expose user-facing feedback path.

## 7. Error Handling Rules
1. Let interceptor handle network and auth-level normalization.
2. In services/screens, wrap async calls with `try/catch`.
3. Use existing UI error patterns (`FormError`, `alert`, `Alert.alert`) for now.

## 8. New API Integration Procedure
1. Define request/response/domain types.
2. Add endpoint methods in `apis/<feature>-api.ts`.
3. Add service methods in `services/<feature>-service.ts`.
4. Consume service in screen/component.
5. Add loading and error states in screen/component.
6. Verify auth behavior for protected routes.

## 9. Prohibited Patterns
1. Calling `fetch`/axios directly inside screens for backend endpoints.
2. Duplicating token retrieval in multiple feature files.
3. Storing auth tokens in non-secure storage.
4. Hardcoding API base URL in feature modules.

## 10. Notes from Current Repository
1. Cloudinary upload currently uses direct `fetch` in `services/image-service.ts`; this is an external service upload path and not part of the `axiosRequest` backend pipeline.
2. Keep this distinction explicit when adding media features.
