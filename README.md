# Checkup360 Frontends Monorepo

Frontend applications and shared packages for **Checkup360**, organized as a monorepo powered by [pnpm Workspaces](https://pnpm.io/workspaces) and [Turborepo](https://turbo.build/).

---

## Monorepo Structure

```text
frontends/
├── apps/
│   ├── web/           # Member/patient portal (PWA) - Port 5173
│   ├── dashboard/     # Corporate HR & occupational health portal - Port 5174
│   └── backoffice/    # Sysadmin administration console - Port 5175
└── packages/
    ├── api/           # API client and typed schema definitions
    ├── auth/          # Authentication provider, session context, and hooks
    ├── components/    # Reusable cross-application business components
    └── ui/            # Design system primitives (Shadcn UI + Tailwind CSS)
```

### Applications (`apps/`)

| Application | Description | Default Dev Port |
|---|---|---|
| **`web`** | Member/patient portal. Health questionnaires, medical onboarding, clinical studies review, and preventive health news from the CMS. | `5173` |
| **`dashboard`** | Enterprise portal for HR and Occupational Health managers. Aggregated health analytics, department management, risk model weighting, and employee invitations. | `5174` |
| **`backoffice`** | Platform-level console for Sysadmins. Organization management, sysadmin role assignment, invitation tracking, and system logs. | `5175` |

---

## Prerequisites

- **Node.js**: `>=20.0.0`
- **pnpm**: `^9.0.0` (or higher)

Install `pnpm` if not already present:

```bash
npm install -g pnpm
```

---

## Getting Started

1. Navigate to the `frontends` directory:
   ```bash
   cd frontends
   ```

2. Configure environment variables (optional for local development; defaults are sourced from `apps.config.ts`):
   ```bash
   cp .env.example .env
   ```

3. Install workspace dependencies:
   ```bash
   pnpm install
   ```

---

## Development

### Run All Applications in Parallel (Turborepo)

```bash
pnpm dev
```

### Run a Single Application

You can target any app using the `--filter` flag:

```bash
# Member portal (web)
pnpm --filter web dev

# Corporate dashboard (dashboard)
pnpm --filter dashboard dev

# Sysadmin console (backoffice)
pnpm --filter backoffice dev
```

---

## UI Design System and Shadcn

Shared UI primitives reside in `@workspace/ui` (`packages/ui`).

### Adding Shadcn UI Components

Always add components from within `packages/ui`:

```bash
cd packages/ui
pnpm dlx shadcn@latest add button
pnpm dlx shadcn@latest add card input dialog # Multiple components
```

Export them in `packages/ui/src/index.ts`:

```ts
export * from "./components/ui/button"
export * from "./components/ui/card"
```

And import them anywhere across the workspace:

```tsx
import { Button } from "@workspace/ui/components/button"
import { Card } from "@workspace/ui/components/card"
```

### Component Placement Guidelines

- `packages/ui/src/components/`: Shadcn UI primitives, free of business domain logic.
- `packages/components/src/`: Composed components shared across multiple applications.
- `apps/<app>/src/components/`: Application-specific components.
- `apps/<app>/src/pages/`: Top-level page views linked to application routes.

---

## Available Scripts

| Command | Description |
|---|---|
| `pnpm dev` | Run all apps in parallel with Fast Refresh (HMR) |
| `pnpm build` | Build all packages and applications for production |
| `pnpm lint` | Run ESLint across all workspaces |
| `pnpm typecheck` | Run static type checking with TypeScript across all workspaces |
| `pnpm format` | Format code using Prettier and Tailwind CSS plugin |
| `pnpm precommit` | Run lint, typecheck, and build validation before commit |

---

## Releases

Tagging a commit with a semantic version (e.g., `git tag v0.6.0 && git push origin v0.6.0`) automatically triggers the GitHub Actions workflow to build and publish the frontend container images to GitHub Container Registry (GHCR).
