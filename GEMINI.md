# Project Whale Shark: React PWA & Golang API

## Description
Project Whale Shark is a responsive, installable Yard-Sale (PWA) application designed to run seamlessly on mobile and desktop browsers.

---

## Core Tech Stack

### Backend
*   **Language & Router:** Go (Golang 1.22+) using native `http.ServeMux` with method-prefixing and path wildcards.
*   **Database:** SQLite transitioning to PostgreSQL via Clean Adapter patterns.
*   **Architecture:** Clean Architecture, Repository, Adapter/Observer, and Abstract Factories.
*   See [Backend Developer Agent Skill](.agents/skills/backend/SKILL.md) and [Backend Reference](.agents/skills/backend/references/gotchas_and_patterns.md).

### Frontend
*   **Language & Framework:** TypeScript, React (v19) & React-DOM, Vite, `vite-plugin-pwa`.
*   **Styling & Theme:** Tailwind CSS (v4) with CSS-first configuration, defaulting to Dark Theme.
*   **Localization (i18n):** `react-i18next` with default Spanish (`es`) and secondary English (`en`). Zero hardcoded strings.
*   **Testing Stack:** Vitest and React Testing Library (RTL) with colocated tests.
*   See [Frontend Developer Agent Skill](.agents/skills/frontend/SKILL.md) and [Frontend Reference](.agents/skills/frontend/references/styling_and_testing.md).

### Planning & UX Specs
*   **Specifications:** Sequentially-numbered, bottom-up specifications written under `planning/specs/`.
*   See [Planning Agent Skill](.agents/skills/planning/SKILL.md), [Planning Reference](.agents/skills/planning/references/architecture_and_workflows.md), [UX Spec Architect Skill](.agents/skills/ux/SKILL.md), and [UX Reference](.agents/skills/ux/references/ux_and_a11y_standards.md).

---

## Agent Execution Rules
1.  **Review Policy:** Always ask for approval before applying file diffs or writing code.
2.  **Validation & Testing Workflow:** Run tests and linting (`pnpm run test` and `pnpm run lint` for frontend; `go test ./...` and `go vet ./...` for backend) exactly once, immediately after finishing ALL implementation tasks. Do not run tests or linting tools dynamically after intermediate code edits or task steps.
3.  **Dependencies Constraint:** Do not install external npm packages unless explicitly requested by the user.
4.  **Grill-Me Protocol:** Before writing specifications or implementing features, conduct a grill-me interview to clarify requirements and design decisions one-by-one, providing recommended options.
5.  **API Contracts & DTOs:** All API Contracts and JSON DTOs must use snake_case (e.g., `verification_code`) even if internal models/variables are not.
6.  **Auth Context & Token Guardrails:** When designing authorization routes or route guards, ensure that any failure to authenticate immediately clears the authentication context (e.g. calling `setToken(null)`) before executing redirect navigations to prevent invalid auth states. Silent user profile fallbacks to mock data are strictly prohibited in production, and must be gated by environment checks (e.g., `import.meta.env.DEV` or similar environment checks).
7.  **TypeScript Type Import Guardrail:** Always use type-only imports (e.g., `import type { UserProfile }`) when importing TypeScript interfaces or types to prevent runtime esbuild/bundler export mismatch errors.
8.  **Side Drawer State Guardrail:** Always manage the application's side drawer state via the global `DrawerProvider` context and the `useDrawer` custom hook. Local/ad-hoc state management for opening, closing, or checking the state of the main navigation drawer is strictly prohibited.

---

## Frontend Architectural Guidelines & Guardrails

### 1. API & Network Invariants (STRICT)
- Zero Raw Network Requests: Never use `fetch()`, `axios`, `XMLHttpRequest`, or raw HTTP requests in React components or pages.
- Centralized API Client Exclusivity: Every network call MUST route through the centralized API client (`@/lib/api/client` or project equivalent). Do not manually assemble base URLs, request headers, or auth tokens in components.
- Strict Type Contracts: All endpoints, query parameters, request bodies, and responses must use explicit TypeScript interfaces (no `any`).

### 2. State & Hook Encapsulation
- Mandatory Custom Hooks: All data retrieval and mutations must be encapsulated within custom React hooks (e.g., `useUserData`, `useUpdateProject`).
- State Architecture: Use standard React primitives (`useState`, `useEffect`, `useCallback`, `useReducer`).
- Return Signature Standards:
  - Query Hooks: `{ data: T | null, isLoading: boolean, error: Error | null, refetch: () => Promise<void> }`
  - Mutation Hooks: `{ mutate: (variables: V) => Promise<T>, isLoading: boolean, error: Error | null, isSuccess: boolean, reset: () => void }`
- Component Safety: Hooks must handle component unmounting and race conditions via `AbortController`.

### 3. Componentization & Colocation Standards
- UI components must only handle presentation and user interactions.
- Feature file layout:
  ```text
  features/[feature-name]/
  ├── api/              # Endpoint definitions using the shared API client
  ├── hooks/            # Feature-specific custom React hooks
  ├── components/       # Presentational & container components
  └── types/            # DTOs, request/response models, hook return types
  ```


