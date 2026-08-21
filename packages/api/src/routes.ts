export const apiRoutes = {
  auth: {
    me: "/auth/me",
    logout: "/auth/logout",
    login: "/auth/login",
    forgotPassword: "/auth/forgot-password",
    resetPassword: "/auth/reset-password",
    googleAuthorize: "/auth/google/authorize",
  },
  invites: {
    admin: "/admin/invites",
    organization: "/invites/organization",
    metadata: (token: string) => `/invites/${encodeURIComponent(token)}`,
    redeem: (token: string) => `/invites/${encodeURIComponent(token)}/redeem`,
    googleSession: (token: string) =>
      `/invites/${encodeURIComponent(token)}/google-session`,
  },
  organizations: "/organizations",
  organizationSummary: (organizationId: string) =>
    `/organizations/${encodeURIComponent(organizationId)}/summary`,
  organizationDepartments: (organizationId: string) =>
    `/organizations/${encodeURIComponent(organizationId)}/departments`,
  organizationDepartment: (organizationId: string, departmentId: string) =>
    `/organizations/${encodeURIComponent(organizationId)}/departments/${encodeURIComponent(departmentId)}`,
  organizationEmployeeDepartment: (organizationId: string, userId: string) =>
    `/organizations/${encodeURIComponent(organizationId)}/employees/${encodeURIComponent(userId)}/department`,
  organizationEmployees: (organizationId: string) =>
    `/organizations/${encodeURIComponent(organizationId)}/employees`,
  members: {
    myDetails: "/members/me/details",
    myProfile: "/members/me/profile",
    myBiometrics: "/members/me/biometrics",
  },
  assessments: {
    evaluate: "/members/me/assessments/evaluate",
  }
} as const
