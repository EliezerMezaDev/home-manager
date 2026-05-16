"use client"

import { useState } from "react"
import { Currency } from "../types"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@shadcn/components/ui/card"
import { Button } from "@shadcn/components/ui/button"
import { Plus, Pencil, Trash2, DollarSign, Bitcoin } from "lucide-react"
import { CurrencyForm } from "./CurrencyForm"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@shadcn/components/ui/alert-dialog"
import { toast } from "sonner"

interface CurrenciesViewProps {
  initialData: Currency[]
  userId: string
}

export function CurrenciesView({ initialData, userId }: CurrenciesViewProps) {
  const [currencies, setCurrencies] = useState<Currency[]>(initialData)
  const [isOpen, setIsOpen] = useState(false)
  const [editingCurrency, setEditingCurrency] = useState<Currency | null>(null)

  const handleSuccess = (currency: Currency) => {
    if (editingCurrency) {
      setCurrencies((prev) =>
        prev.map((c) => (c.id === currency.id ? currency : c))
      )
      toast.success("Moneda actualizada")
    } else {
      setCurrencies((prev) => [...prev, currency])
      toast.success("Moneda creada")
    }
    setIsOpen(false)
    setEditingCurrency(null)
  }

  const handleDelete = async (id: number) => {
    try {
      const { deleteCurrency } = await import("../actions/currencies-actions")
      await deleteCurrency(id)
      setCurrencies((prev) => prev.filter((c) => c.id !== id))
      toast.success("Moneda eliminada")
    } catch (error) {
      toast.error("Error al eliminar la moneda")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Monedas</h1>
          <p className="text-muted-foreground">
            Administra las monedas de tu hogar
          </p>
        </div>
        <Button onClick={() => setIsOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nueva Moneda
        </Button>
      </div>

      {currencies.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10">
            <DollarSign className="mb-4 h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground">No hay monedas registradas</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => setIsOpen(true)}
            >
              Crear tu primera moneda
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {currencies.map((currency) => (
            <Card key={currency.id}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg font-medium">
                  {currency.code}
                </CardTitle>
                <div className="flex items-center gap-1">
                  {currency.isCrypto ? (
                    <Bitcoin className="h-4 w-4 text-orange-500" />
                  ) : (
                    <DollarSign className="h-4 w-4 text-green-500" />
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{currency.name}</p>
                <p className="mt-2 text-2xl font-bold">{currency.symbol}</p>
                <div className="mt-4 flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingCurrency(currency)
                      setIsOpen(true)
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar moneda?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta acción no se puede deshacer.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(currency.id)}
                        >
                          Eliminar
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {isOpen && (
        <CurrencyForm
          userId={userId}
          currency={editingCurrency}
          onSuccess={handleSuccess}
          onClose={() => {
            setIsOpen(false)
            setEditingCurrency(null)
          }}
        />
      )}
    </div>
  )
}
