export const apiRoutes = {
  auth: {
    me: "/auth/me",
    logout: "/auth/logout",
    login: "/auth/login",
    googleAuthorize: "/auth/google/authorize",
  },
  invites: {
    admin: "/admin/invites",
    organization: "/invites/organization",
    googleSession: (token: string) => `/invites/${encodeURIComponent(token)}/google-session`,
    register: (token: string) => `/invites/${encodeURIComponent(token)}/register`,
  },
  organizations: "/organizations",
} as const