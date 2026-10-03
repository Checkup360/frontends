export function getRoleBadgeProps(role: string): {
  variant: "info-light" | "warning-light" | "outline" | "secondary"
  className?: string
} {
  switch (role) {
    case "superadmin":
      return {
        variant: "secondary",
        className:
          "bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30 font-semibold",
      }
    case "admin":
      return { variant: "info-light" }
    case "content_manager":
      return { variant: "warning-light" }
    case "member":
      return { variant: "outline" }
    default:
      return { variant: "secondary" }
  }
}

export function formatRoleName(role: string): string {
  switch (role) {
    case "superadmin":
      return "Superadmin"
    case "admin":
      return "Admin"
    case "content_manager":
      return "Content Manager"
    case "member":
      return "Member"
    default:
      return role
  }
}

export function normalizeRoles(roles: string[] | undefined | null): string[] {
  if (!roles) return []
  if (roles.includes("superadmin")) {
    return roles.filter((role) => role !== "admin")
  }
  return roles
}
