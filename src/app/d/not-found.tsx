import Link from "next/link"
import { notFound } from "next/navigation"

import { Button } from "@shadcn/components/ui/button"

export default function NotFound() {
  return (
    <div className="flex h-full flex-col items-center justify-center space-y-4">
      <h2 className="text-2xl font-bold">Página no encontrada</h2>
      <p className="text-muted-foreground">
        La página que buscas no existe o ha sido movida.
      </p>
      <Button asChild>
        <Link href="/d">Volver al dashboard</Link>
      </Button>
    </div>
  )
}
