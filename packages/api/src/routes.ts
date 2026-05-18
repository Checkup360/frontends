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
    metadata: (token: string) => `/invites/${encodeURIComponent(token)}`,
    redeem: (token: string) => `/invites/${encodeURIComponent(token)}/redeem`,
    googleSession: (token: string) => `/invites/${encodeURIComponent(token)}/google-session`,
  },
  organizations: "/organizations",
  members: {
    myDetails: "/members/me/details",
  },
} as const
