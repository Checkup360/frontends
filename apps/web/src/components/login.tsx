import {
  fetchGoogleAuthorizationUrl,
  getPostLoginRedirectUrl,
  savePostLoginRedirectUrl,
} from "@workspace/auth/api"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { Separator } from "@workspace/ui/components/separator"
import { useEffect, useState } from "react"
import type { JSX, SVGProps } from "react"

const GoogleIcon = (
  props: JSX.IntrinsicAttributes & SVGProps<SVGSVGElement>
) => (
  <svg fill="currentColor" viewBox="0 0 24 24" {...props}>
    <path d="M3.06364 7.50914C4.70909 4.24092 8.09084 2 12 2C14.6954 2 16.959 2.99095 18.6909 4.60455L15.8227 7.47274C14.7864 6.48185 13.4681 5.97727 12 5.97727C9.39542 5.97727 7.19084 7.73637 6.40455 10.1C6.2045 10.7 6.09086 11.3409 6.09086 12C6.09086 12.6591 6.2045 13.3 6.40455 13.9C7.19084 16.2636 9.39542 18.0227 12 18.0227C13.3454 18.0227 14.4909 17.6682 15.3864 17.0682C16.4454 16.3591 17.15 15.3 17.3818 14.05H12V10.1818H21.4181C21.5364 10.8363 21.6 11.5182 21.6 12.2273C21.6 15.2727 20.5091 17.8363 18.6181 19.5773C16.9636 21.1046 14.7 22 12 22C8.09084 22 4.70909 19.7591 3.06364 16.4909C2.38638 15.1409 2 13.6136 2 12C2 10.3864 2.38638 8.85911 3.06364 7.50914Z" />
  </svg>
)

type LoginProps = {
  googleAuthorizeUrl?: string
  apiBaseUrl?: string
}

export default function Login({
  googleAuthorizeUrl,
  apiBaseUrl,
}: LoginProps) {
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [googleError, setGoogleError] = useState<string | null>(null)

  const postLoginRedirectUrl = getPostLoginRedirectUrl(new URL(window.location.href))

  // Save destination as soon as the login page loads so storage is set
  // even before the user interacts with the page.
  useEffect(() => {
    savePostLoginRedirectUrl(postLoginRedirectUrl)
  }, [postLoginRedirectUrl])

  const handleGoogleSignIn = async () => {
    try {
      setGoogleError(null)
      setIsGoogleLoading(true)

      savePostLoginRedirectUrl(postLoginRedirectUrl)
      const payload =
        googleAuthorizeUrl ?
          { authorization_url: googleAuthorizeUrl }
        : await fetchGoogleAuthorizationUrl(apiBaseUrl ?? import.meta.env.VITE_API_URL)

      window.location.assign(payload.authorization_url)
    } catch (error) {
      const fallbackMessage = "No se pudo iniciar sesion con Google."
      setGoogleError(error instanceof Error ? error.message : fallbackMessage)
      setIsGoogleLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-dvh">
      <div className="flex flex-1 flex-col justify-center px-4 py-10 lg:px-6">
        <div className="sm:mx-auto sm:w-full sm:max-w-sm">
          <h2 className="text-balance text-center text-xl font-semibold text-foreground">
            Log in or create account
          </h2>
          <form action="#" method="post" className="mt-6">
            <Label htmlFor="email" className="font-medium text-foreground">
              Email
            </Label>
            <Input
              type="email"
              id="email"
              name="email"
              autoComplete="email"
              placeholder="john@company.com"
              className="mt-2"
            />
            <Button type="submit" className="mt-4 w-full">
              Sign in
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                or with
              </span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="inline-flex w-full items-center justify-center space-x-2"
            onClick={handleGoogleSignIn}
            disabled={isGoogleLoading}
          >
            <GoogleIcon className="size-5" aria-hidden={true} />
            <span className="text-sm font-medium">
              {isGoogleLoading ? "Redirecting to Google..." : "Sign in with Google"}
            </span>
          </Button>
          {googleError ? (
            <p className="mt-2 text-xs text-destructive">{googleError}</p>
          ) : null}

          <p className="text-pretty mt-4 text-xs text-muted-foreground">
            By signing in, you agree to our{" "}
            <a href="#" className="underline underline-offset-4">
              terms of service
            </a>{" "}
            and{" "}
            <a href="#" className="underline underline-offset-4">
              privacy policy
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  )
}