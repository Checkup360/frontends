export const apiRoutes = {
  auth: {
    me: "/auth/me",
    logout: "/auth/logout",
    login: "/auth/login",
    refresh: "/auth/refresh",
    forgotPassword: "/auth/forgot-password",
    resetPassword: "/auth/reset-password",
    googleAuthorize: "/auth/google/authorize",
  },
  admin: {
    sysadmins: "/admin/sysadmins",
    sysadminStats: "/admin/sysadmins/stats",
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
  organization: (organizationId: string) =>
    `/organizations/${encodeURIComponent(organizationId)}`,
  organizationLogo: (organizationId: string) =>
    `/organizations/${encodeURIComponent(organizationId)}/logo`,
  organizationSummary: (organizationId: string) =>
    `/organizations/${encodeURIComponent(organizationId)}/summary`,
  organizationDepartments: (organizationId: string) =>
    `/organizations/${encodeURIComponent(organizationId)}/departments`,
  organizationDepartment: (organizationId: string, departmentId: string) =>
    `/organizations/${encodeURIComponent(organizationId)}/departments/${encodeURIComponent(departmentId)}`,
  organizationEmployeeDepartment: (organizationId: string, userId: string) =>
    `/organizations/${encodeURIComponent(organizationId)}/employees/${encodeURIComponent(userId)}/department`,
  organizationEmployeeRoles: (organizationId: string, userId: string) =>
    `/organizations/${encodeURIComponent(organizationId)}/employees/${encodeURIComponent(userId)}/roles`,
  organizationEmployee: (organizationId: string, userId: string) =>
    `/organizations/${encodeURIComponent(organizationId)}/employees/${encodeURIComponent(userId)}`,
  organizationEmployees: (organizationId: string) =>
    `/organizations/${encodeURIComponent(organizationId)}/employees`,
  organizationSuperadminRemovalRequests: (organizationId: string) =>
    `/organizations/${encodeURIComponent(organizationId)}/superadmin-removal-requests`,
  organizationSuperadminRemovalRequestCreate: (organizationId: string, userId: string) =>
    `/organizations/${encodeURIComponent(organizationId)}/superadmins/${encodeURIComponent(userId)}/removal-requests`,
  organizationSuperadminRemovalRequestVote: (organizationId: string, requestId: string) =>
    `/organizations/${encodeURIComponent(organizationId)}/superadmin-removal-requests/${encodeURIComponent(requestId)}/votes`,
  organizationScoreWeights: (organizationId: string) =>
    `/organizations/${encodeURIComponent(organizationId)}/score-weights`,
  organizationAnalyticsTrends: (organizationId: string, months = 12, departmentId?: string) => {
    let url = `/organizations/${encodeURIComponent(organizationId)}/analytics/trends?months=${months}`
    if (departmentId) {
      url += `&department_id=${encodeURIComponent(departmentId)}`
    }
    return url
  },
  organizationAnalyticsDepartments: (organizationId: string) =>
    `/organizations/${encodeURIComponent(organizationId)}/analytics/departments`,
  organizationRegistrationTrends: (organizationId: string) =>
    `/organizations/${encodeURIComponent(organizationId)}/registration-trends`,



  consents: {
    current: "/consents/current",
    accept: "/consents",
    revoke: (id: string) => `/consents/${encodeURIComponent(id)}/revoke`,
  },
  members: {
    myDetails: "/members/me/details",
    myProfile: "/members/me/profile",
    myAvatar: "/members/me/avatar",
    riskPriorities: "/members/me/risk-priorities",
    myActiveForms: "/members/me/forms/active",
    myForm: (formType: string) =>
      `/members/me/forms/${encodeURIComponent(formType)}`,
  },
} as const
