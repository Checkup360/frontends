import { useState } from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@workspace/ui/components/command"
import { cn } from "@workspace/ui/lib/utils"
import type { OrganizationResponse } from "@workspace/api"

export interface OrganizationComboboxProps {
  organizations: OrganizationResponse[]
  value: string
  onValueChange: (value: string) => void
  disabled?: boolean
  placeholder?: string
  loading?: boolean
  className?: string
  includeAllOption?: boolean
}

export function OrganizationCombobox({
  organizations,
  value,
  onValueChange,
  disabled,
  placeholder = "Select organization",
  loading,
  className,
  includeAllOption,
}: OrganizationComboboxProps) {
  const [open, setOpen] = useState(false)

  // Filter out E2E test organizations that have timestamps and random hashes
  const validOrgs = organizations.filter(
    (org) => !/\d{13}-[a-z0-9]+$/i.test(org.name)
  )

  const selectedOrg = validOrgs.find((org) => org.id === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={
            disabled || loading || (validOrgs.length === 0 && !includeAllOption)
          }
          className={cn("w-full justify-between font-normal", className)}
        >
          <span className="truncate">
            {loading
              ? "Loading..."
              : value === "all"
                ? "All Organizations"
                : selectedOrg
                  ? selectedOrg.name
                  : placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="p-0"
        style={{ width: "var(--radix-popover-trigger-width)" }}
        align="start"
      >
        <Command>
          <CommandInput placeholder="Search organization..." />
          <CommandList>
            <CommandEmpty>No organization found.</CommandEmpty>
            <CommandGroup>
              {includeAllOption && (
                <CommandItem
                  value="All Organizations"
                  onSelect={() => {
                    onValueChange("all")
                    setOpen(false)
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === "all" ? "opacity-100" : "opacity-0"
                    )}
                  />
                  All Organizations
                </CommandItem>
              )}
              {validOrgs.map((organization) => (
                <CommandItem
                  key={organization.id}
                  value={organization.name}
                  onSelect={() => {
                    onValueChange(organization.id)
                    setOpen(false)
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === organization.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {organization.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
