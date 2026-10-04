import { useEffect, useState } from "react"
import { useCurrentUser } from "@workspace/auth/hooks/use-current-user"
import {
  updateEmployeeRoles,
  type OrganizationEmployee,
  type OrganizationEmployeeRole,
} from "@workspace/api"
import { Button } from "@workspace/ui/components/button"
import { Checkbox } from "@workspace/ui/components/checkbox"
import { Label } from "@workspace/ui/components/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import { toast } from "@workspace/ui/components/sonner"
import { formatEmployeeName } from "@workspace/components/components/employee-profile-card"
import { describeRoleChangeError } from "@/lib/role-utils"

export interface ManageRolesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  employee: OrganizationEmployee | null
  organizationId?: string | null
  isCurrentUserSuperadmin: boolean
  isCurrentUserAdmin: boolean
  onSuccess?: () => void
}

export function ManageRolesDialog({
  open,
  onOpenChange,
  employee,
  organizationId,
  isCurrentUserSuperadmin,
  isCurrentUserAdmin,
  onSuccess,
}: ManageRolesDialogProps) {
  const [selectedRoles, setSelectedRoles] = useState<
    OrganizationEmployeeRole[]
  >([])
  const [actionLoading, setActionLoading] = useState(false)
  const { user } = useCurrentUser()
  const isSelf = Boolean(user?.email && employee?.email === user.email)
  const isEmployeeSuperadmin = employee?.roles?.includes("superadmin") ?? false

  useEffect(() => {
    if (open && employee) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedRoles([...(employee.roles || [])] as OrganizationEmployeeRole[])
    }
  }, [open, employee])

  const handleSaveRoles = async () => {
    if (!organizationId || !employee) return
    setActionLoading(true)
    try {
      const res = await updateEmployeeRoles(
        organizationId,
        employee.id,
        selectedRoles
      )
      if (res.error) {
        toast.error(describeRoleChangeError(res.error.message))
      } else {
        toast.success("Employee roles updated successfully.")
        onOpenChange(false)
        onSuccess?.()
      }
    } catch {
      toast.error("Failed to update employee roles")
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Manage Employee Roles</DialogTitle>
          <DialogDescription>
            Update organization roles for{" "}
            <span className="font-semibold text-foreground">
              {employee
                ? formatEmployeeName(employee) || employee.email
                : ""}
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-3">
          {/* Superadmin role */}
          <div className="flex items-start space-x-3 rounded-lg border border-border/60 p-3">
            <Checkbox
              id="role-superadmin"
              checked={selectedRoles.includes("superadmin")}
              // Superadmins manage other superadmins, never their own role
              disabled={!isCurrentUserSuperadmin || (isSelf && isEmployeeSuperadmin)}
              onCheckedChange={(checked) => {
                if (checked) {
                  setSelectedRoles(
                    Array.from(
                      new Set([...selectedRoles, "superadmin", "admin"])
                    )
                  )
                } else {
                  setSelectedRoles(
                    selectedRoles.filter((r) => r !== "superadmin")
                  )
                }
              }}
            />
            <div className="grid gap-1">
              <Label
                htmlFor="role-superadmin"
                className="cursor-pointer font-semibold"
              >
                Superadmin
              </Label>
              <p className="text-xs text-muted-foreground">
                Full administrative power, including managing other
                superadmins.
                {isSelf && isEmployeeSuperadmin && (
                  <span className="mt-0.5 block font-medium text-amber-600 dark:text-amber-400">
                    * You can&apos;t remove your own superadmin role.
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Admin role */}
          <div className="flex items-start space-x-3 rounded-lg border border-border/60 p-3">
            <Checkbox
              id="role-admin"
              checked={selectedRoles.includes("admin")}
              disabled={
                !isCurrentUserSuperadmin ||
                selectedRoles.includes("superadmin")
              }
              onCheckedChange={(checked) => {
                if (checked) {
                  setSelectedRoles([...selectedRoles, "admin"])
                } else {
                  setSelectedRoles(selectedRoles.filter((r) => r !== "admin"))
                }
              }}
            />
            <div className="grid gap-1">
              <Label
                htmlFor="role-admin"
                className="cursor-pointer font-semibold"
              >
                Admin
              </Label>
              <p className="text-xs text-muted-foreground">
                Organizational management, employee onboarding and dashboard
                access.
                {selectedRoles.includes("superadmin") ? (
                  <span className="mt-0.5 block text-xs font-medium text-amber-600 dark:text-amber-400">
                    * Required while Superadmin is active.
                  </span>
                ) : (
                  !isCurrentUserSuperadmin && (
                    <span className="mt-0.5 block text-muted-foreground/80 italic">
                      * Only Superadmins can assign/remove Admin roles.
                    </span>
                  )
                )}
              </p>
            </div>
          </div>

          {/* Content Manager role */}
          <div className="flex items-start space-x-3 rounded-lg border border-border/60 p-3">
            <Checkbox
              id="role-content-manager"
              checked={selectedRoles.includes("content_manager")}
              disabled={!isCurrentUserSuperadmin && !isCurrentUserAdmin}
              onCheckedChange={(checked) => {
                if (checked) {
                  setSelectedRoles([...selectedRoles, "content_manager"])
                } else {
                  setSelectedRoles(
                    selectedRoles.filter((r) => r !== "content_manager")
                  )
                }
              }}
            />
            <div className="grid gap-1">
              <Label
                htmlFor="role-content-manager"
                className="cursor-pointer font-semibold"
              >
                Content Manager
              </Label>
              <p className="text-xs text-muted-foreground">
                Access to CMS articles and publication tools.
              </p>
            </div>
          </div>

          {/* Member role */}
          <div className="flex items-start space-x-3 rounded-lg border border-border/60 p-3">
            <Checkbox
              id="role-member"
              checked={selectedRoles.includes("member")}
              disabled={!isCurrentUserSuperadmin && !isCurrentUserAdmin}
              onCheckedChange={(checked) => {
                if (checked) {
                  setSelectedRoles([...selectedRoles, "member"])
                } else {
                  setSelectedRoles(
                    selectedRoles.filter((r) => r !== "member")
                  )
                }
              }}
            />
            <div className="grid gap-1">
              <Label
                htmlFor="role-member"
                className="cursor-pointer font-semibold"
              >
                Member
              </Label>
              <p className="text-xs text-muted-foreground">
                Patient portal access, clinical surveys, and health profiles.
              </p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={actionLoading}
          >
            Cancel
          </Button>
          <Button onClick={handleSaveRoles} disabled={actionLoading}>
            {actionLoading ? "Saving..." : "Save Roles"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
