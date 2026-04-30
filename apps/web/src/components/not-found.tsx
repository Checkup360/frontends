import { Button } from "@workspace/ui/components/button"
import { Link } from "react-router-dom"

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <p className="text-6xl font-semibold tracking-tight text-muted-foreground/40">404</p>
      <h1 className="mt-4 text-xl font-semibold text-foreground">Página no encontrada</h1>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        La ruta que buscás no existe o fue movida.
      </p>
      <Button asChild className="mt-8">
        <Link to="/">Ir al inicio</Link>
      </Button>
    </div>
  )
}
