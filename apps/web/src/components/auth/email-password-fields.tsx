import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"

type EmailPasswordFieldsProps = {
  email: string
  password: string
  onEmailChange: (value: string) => void
  onPasswordChange: (value: string) => void
  disabled?: boolean
  emailId?: string
  passwordId?: string
  emailAutocomplete?: string
  passwordAutocomplete?: string
}

export function EmailPasswordFields({
  email,
  password,
  onEmailChange,
  onPasswordChange,
  disabled,
  emailId = "auth-email",
  passwordId = "auth-password",
  emailAutocomplete = "email",
  passwordAutocomplete,
}: EmailPasswordFieldsProps) {
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor={emailId} className="font-medium text-foreground">
          Email
        </Label>
        <Input
          id={emailId}
          type="email"
          name="email"
          autoComplete={emailAutocomplete}
          placeholder="nombre@empresa.com"
          className="mt-2"
          value={email}
          onChange={(e) => onEmailChange(e.target.value)}
          disabled={disabled}
          required
        />
      </div>
      <div>
        <Label htmlFor={passwordId} className="font-medium text-foreground">
          Contraseña
        </Label>
        <Input
          id={passwordId}
          type="password"
          name="password"
          autoComplete={passwordAutocomplete ?? "current-password"}
          placeholder="••••••••"
          className="mt-2"
          value={password}
          onChange={(e) => onPasswordChange(e.target.value)}
          disabled={disabled}
          required
        />
      </div>
    </div>
  )
}
