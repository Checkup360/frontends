# Frontends

## Requisitos

Si no tenés pnpm instalado:

```bash
npm install -g pnpm
```

## Setup del proyecto

### Instalar dependencias

```bash
pnpm install
```

## Correr en desarrollo

### Todas las apps en paralelo

```bash
pnpm dev
```

### Una app específica

```bash
pnpm --filter web dev
pnpm --filter admin dev
```

## Agregar componentes de shadcn

Los componentes de shadcn se agregan **siempre desde `packages/ui`**:

```bash
cd packages/ui
pnpm dlx shadcn@latest add button
pnpm dlx shadcn@latest add card input dialog  # varios a la vez
```

Luego exportarlos desde `packages/ui/src/index.ts`:

```ts
export * from "./components/ui/button"
export * from "./components/ui/card"
```

Y usarlos en cualquier app:

```tsx
import { Button, Card } from "@repo/ui"
```

## Agregar una nueva app

```bash
cd apps
pnpm create vite nueva-app --template react-ts
cd nueva-app
```

Agregar la dependencia al paquete UI en su `package.json`:

```json
{
  "dependencies": {
    "@repo/ui": "workspace:*"
  }
}
```

Volver a la raíz e instalar:

```bash
cd ../..
pnpm install
```

---

## Scripts disponibles

| Comando                        | Descripción                          |
|-------------------------------|--------------------------------------|
| `pnpm install`                | Instala todas las dependencias       |
| `pnpm dev`                    | Levanta todas las apps en paralelo   |
| `pnpm --filter web dev`       | Levanta solo la app `web`            |
| `pnpm --filter admin dev`     | Levanta solo la app `admin`          |
| `pnpm --filter web build`     | Build de producción de `web`         |
| `pnpm -r build`               | Build de todas las apps              |
