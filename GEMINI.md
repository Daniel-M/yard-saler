# Project Whale Shark: React PWA & Golang API

## Description
Project Whale Shark is a responsive, installable Yard-Sale (PWA) application designed to run seamlessly on mobile and desktop browsers.

---

## System Architecture

### Backend
*   **Language:** Go (Golang 1.22+)
*   **Router:** Native `http.ServeMux` using method-prefixing and path wildcards.
*   **Database:** SQLite for local/development, transitioning to PostgreSQL via clean Adapter patterns.
*   **Architecture Patterns:** Clean Architecture, Repository Pattern, Adapter/Observer Pattern (for Push Notifications/dispatchers), and Abstract Factories.

### Frontend
*   **Language:** TypeScript (TSX)
*   **Build & PWA Core:** React, Vite, `vite-plugin-pwa`
*   **Dependencies Management:** `pnpm`
*   **Styling:** Tailwind CSS (`tailwindcss`, `@tailwindcss/vite`)
*   **Icons:** `lucide-react`
*   **Theme:** Default to **Dark Theme** first.
*   **Localization (i18n):** Powered by `react-i18next`.
*   **Testing Stack:** Vitest and React Testing Library (RTL).

---

## UI & Feature Requirements

1.  **Carousel for Listings:**
    *   Every listing detail view must support an image carousel displaying at least 3 images.
2.  **Location & Event Fields:**
    *   Support filtering and searching listings by simple text locations (address, city, zip code).
    *   Display structured event details (host, time, address) prominently on listing pages.
3.  **Strict Localization (i18n):**
    *   Direct text must not be hardcoded in UI components. Wrap all user-facing text in translation keys/i18n helpers.

---

## Guidelines & Guardrails

### Backend Guidelines
*   **Decoupling:** Direct database connections or channel-specific client SDKs must not be accessed outside their corresponding adapter packages.
*   **Migrations:** Explicitly define and track database migrations inside the `migrations/` directory.
*   **Testing:** Write unit and integration tests using mocked repositories and notification channels. Run tests using `go test ./...`.

### Frontend Guidelines

#### 1. Theme (Dark Theme Default)
*   The application must default to a premium Dark Theme.
*   **Base Styling:** Use dark backgrounds (e.g., `bg-slate-950`, `bg-zinc-900`) and high-contrast readable text (e.g., `text-slate-50`, `text-zinc-100`) as the default body style.
*   **Consistency:** Avoid hardcoded bright light backgrounds (like `bg-white`) unless explicitly styled inside components that support active dual-theme elements. Ensure all custom controls, cards, and modal components adapt correctly.

#### 2. Localization (`react-i18next`)
*   All user-facing copy must reside in translation files (e.g., `src/locales/{en,es}.json`).
*   Retrieve labels using the `useTranslation` hook: `const { t } = useTranslation();`.
*   Maintain organized, descriptive translation keys (e.g., `t('listings.details.hostLabel')`).

#### 3. Testing (Vitest & React Testing Library)
*   Write unit and component tests with Vitest and `@testing-library/react`.
*   **Test Files:** Place tests adjacent to components or in `__tests__/` naming them `*.test.tsx` or `*.spec.tsx`.
*   **Best Practices:**
    *   Prefer querying elements via accessible roles (`screen.getByRole`) over test IDs or raw class query selectors.
    *   Mock external dependencies, routing hooks, and global state providers.
    *   Use `@testing-library/user-event` to simulate user interactions.

#### 4. Components & Styling
*   Use Tailwind CSS for responsive grid/flex layout patterns and smooth interactive states.
*   Prioritize reusable UI components and Higher-Order Components (HOCs) to avoid design drift.

---

## Agent Execution Rules
1.  **Review Policy:** Always ask for approval before applying file diffs or writing code.
2.  **TDD Workflow:** Run `pnpm run test` (frontend) or `go test ./...` (backend) after every file modification to maintain strict TDD standards.
3.  **Dependencies Constraint:** Do not install external npm packages unless explicitly requested by the user.
