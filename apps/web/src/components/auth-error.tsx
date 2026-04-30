import { Link, useSearchParams } from "react-router-dom"

export default function AuthError() {
  const [searchParams] = useSearchParams()
  const reason = searchParams.get("reason")

  const errorMessages: Record<string, { title: string; message: string }> = {
    no_invite: {
      title: "Se requiere una invitación",
      message:
        "No tienes una invitación válida. Por favor, pide a un administrador que te envíe un enlace de invitación.",
    },
    invalid_invite: {
      title: "Invitación inválida",
      message: "El token de invitación no existe o es incorrecto.",
    },
    invalid_token: {
      title: "Enlace inválido",
      message: "El enlace de invitación no es válido. Pedí un nuevo enlace al administrador.",
    },
    invite_used: {
      title: "Invitación ya utilizada",
      message: "Este token ya fue utilizado por otro usuario. Por favor, pide una nueva invitación.",
    },
    invite_expired: {
      title: "Invitación expirada",
      message: "El token de invitación ha expirado. Por favor, pide una nueva invitación.",
    },
    email_mismatch: {
      title: "Email no coincide",
      message:
        "El email de tu cuenta de Google no coincide con el email asociado a esta invitación. Intenta con la cuenta correcta.",
    },
    no_request: {
      title: "Error en la solicitud",
      message: "Ocurrió un error al procesar tu solicitud. Por favor, intenta de nuevo.",
    },
  }

  const error = errorMessages[reason || ""] || {
    title: "Error de autenticación",
    message: "Ocurrió un error desconocido. Por favor, intenta de nuevo.",
  }

  return (
    <div className="mx-auto mt-20 max-w-xl rounded-lg border border-red-200 bg-red-50 p-6">
      <h1 className="text-lg font-semibold text-red-900">{error.title}</h1>
      <p className="mt-2 text-sm text-red-800">{error.message}</p>
      <div className="mt-4 flex gap-2">
        <Link
          to="/login"
          className="inline-flex items-center justify-center rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
        >
          Volver al login
        </Link>
      </div>
    </div>
  )
}
