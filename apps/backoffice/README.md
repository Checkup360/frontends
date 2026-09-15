# Checkup360 Backoffice (Platform Administration Console)

Administration console for **System Administrators (Sysadmins)** of the **Checkup360** multi-tenant platform.

It manages platform-wide resources: onboarding and maintaining client organizations, assigning sysadmin privileges, monitoring global invitation queues, and inspecting system logs.

---

## Key Features

- **Organization Management:** Provisioning, configuration, and inspection of all client companies registered on the platform.
- **Sysadmin Administration:** Granting and revoking superuser roles and platform-level privileges.
- **Global Invitation Tracking:** Auditing, searching, and managing pending member and administrator invitations.
- **System Event Logs:** Live inspection of operational logs and audit events for technical support and troubleshooting.

---

## Tech Stack

- **Framework:** [React 19](https://react.dev/) + [Vite](https://vitejs.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Styling & Components:** [Tailwind CSS](https://tailwindcss.com/) + Shadcn UI (via `@workspace/ui`)
- **Internal Packages:**
  - `@workspace/api`: Sysadmin-protected API endpoints (`/admin/*`).
  - `@workspace/auth`: Access control guarded strictly by `is_sysadmin`.
  - `@workspace/ui`: Reusable design system primitives.

---

## Getting Started

From the monorepo root (`frontends/`):

```bash
# Install dependencies
pnpm install

# Run the backoffice console in development mode
pnpm --filter backoffice dev
```

The application will run at:
`http://localhost:5175`

### Available Scripts

```bash
# Start development server
pnpm --filter backoffice dev

# Type check
pnpm --filter backoffice typecheck

# Lint
pnpm --filter backoffice lint

# Production build
pnpm --filter backoffice build

# Preview production build (port 4175)
pnpm --filter backoffice preview
```
