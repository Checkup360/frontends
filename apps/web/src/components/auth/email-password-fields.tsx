import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { EyeIcon, EyeOffIcon } from "lucide-react"
import { useState } from "react"

type EmailFieldProps = {
  email: string
  onEmailChange: (value: string) => void
  disabled?: boolean
  id?: string
  autocomplete?: string
}

export function EmailField({
  email,
  onEmailChange,
  disabled,
  id = "auth-email",
  autocomplete = "email",
}: EmailFieldProps) {
  return (
    <div>
      <Label htmlFor={id} className="font-medium text-foreground">
        Email
      </Label>
      <Input
        id={id}
        type="email"
        name="email"
        autoComplete={autocomplete}
        placeholder="name@company.com"
        className="mt-2"
        value={email}
        onChange={(event) => onEmailChange(event.target.value)}
        disabled={disabled}
        required
      />
    </div>
  )
}

type PasswordFieldProps = {
  password: string
  onPasswordChange: (value: string) => void
  label?: string
  disabled?: boolean
  id?: string
  autocomplete?: string
}

export function PasswordField({
  password,
  onPasswordChange,
  label = "Password",
  disabled,
  id = "auth-password",
  autocomplete = "current-password",
}: PasswordFieldProps) {
  const [passwordVisible, setPasswordVisible] = useState(false)

  return (
    <div>
      <Label htmlFor={id} className="font-medium text-foreground">
        {label}
      </Label>
      <div className="relative mt-2">
        <Input
          id={id}
          type={passwordVisible ? "text" : "password"}
          name="password"
          autoComplete={autocomplete}
          placeholder="••••••••"
          className="pr-10"
          value={password}
          onChange={(event) => onPasswordChange(event.target.value)}
          disabled={disabled}
          required
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute top-0 right-0 h-full text-muted-foreground"
          onClick={() => setPasswordVisible((visible) => !visible)}
          disabled={disabled}
          aria-label={passwordVisible ? "Hide password" : "Show password"}
          aria-pressed={passwordVisible}
        >
          {passwordVisible ? <EyeOffIcon /> : <EyeIcon />}
        </Button>
      </div>
    </div>
  )
}

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
      <EmailField
        email={email}
        onEmailChange={onEmailChange}
        disabled={disabled}
        id={emailId}
        autocomplete={emailAutocomplete}
      />
      <PasswordField
        password={password}
        onPasswordChange={onPasswordChange}
        disabled={disabled}
        id={passwordId}
        autocomplete={passwordAutocomplete}
      />
    </div>
  )
}
