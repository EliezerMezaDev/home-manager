"use client"

import { useState } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@shadcn/components/ui/card"
import { Button } from "@shadcn/components/ui/button"
import { Plus, Trash2, Star, StarOff } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { ExchangeRateForm } from "./ExchangeRateForm"
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
import { toastError, toastSuccess } from "@shared/lib/toast-utils"
import type { ExchangeRate } from "../types"
import type { Currency } from "@/modules/currencies/types"
import { deleteExchangeRate, setGlobalExchangeRate } from "../actions/exchange-rates-actions"

interface ExchangeRatesViewProps {
  initialData: ExchangeRate[]
  currencies: Currency[]
  userId: string
  globalRate?: ExchangeRate | null
}

export function ExchangeRatesView({
  initialData,
  currencies,
  userId,
  globalRate,
}: ExchangeRatesViewProps) {
  const [rates, setRates] = useState<ExchangeRate[]>(initialData)
  const [currentGlobalRate, setCurrentGlobalRate] = useState<ExchangeRate | null>(globalRate || null)
  const [isOpen, setIsOpen] = useState(false)

  const handleSuccess = (rate: ExchangeRate) => {
    if (rate.isGlobal) {
      setCurrentGlobalRate(rate)
    }
    setRates((prev) => {
      const exists = prev.find((r) => r.id === rate.id)
      if (exists) {
        return prev.map((r) => (r.id === rate.id ? rate : r))
      }
      return [rate, ...prev]
    })
    setIsOpen(false)
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteExchangeRate(id)
      setRates((prev) => prev.filter((r) => r.id !== id))
      if (currentGlobalRate?.id === id) {
        setCurrentGlobalRate(null)
      }
      toastSuccess("Tasa eliminada")
    } catch (error) {
      toastError(error instanceof Error ? error.message : "Error al eliminar")
    }
  }

  const handleSetGlobal = async (rate: ExchangeRate) => {
    try {
      const updated = await setGlobalExchangeRate(
        userId,
        rate.baseCurrencyId,
        rate.referenceCurrencyId,
        Number(rate.rate)
      )
      setCurrentGlobalRate(updated as ExchangeRate)
      setRates((prev) =>
        prev.map((r) => ({
          ...r,
          isGlobal: r.id === updated.id,
        }))
      )
      toastSuccess("Tasa global actualizada")
    } catch (error) {
      toastError(error instanceof Error ? error.message : "Error al establecer tasa global")
    }
  }

  const usdToVesRate = rates.find(
    (r) => r.baseCurrency?.code === "USD" && r.referenceCurrency?.code === "VES"
  )
  const vesToUsdRate = rates.find(
    (r) => r.baseCurrency?.code === "VES" && r.referenceCurrency?.code === "USD"
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tasas de Cambio</h1>
          <p className="text-muted-foreground">
            Administra las tasas de cambio de tu hogar
          </p>
        </div>
        <Button onClick={() => setIsOpen(true)}>
          <Plus className="mr-2 h-6 w-6" />
          Nueva Tasa
        </Button>
      </div>

      {currentGlobalRate && (
        <Card className="border-primary bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Star className="h-5 w-5 fill-yellow-500 text-yellow-500" />
              Tasa Global
            </CardTitle>
            <CardDescription>
              Se usará por defecto en nuevas transacciones
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              1 {currentGlobalRate.baseCurrency?.code} ={" "}
              {Number(currentGlobalRate.rate).toFixed(2)} {currentGlobalRate.referenceCurrency?.code}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Actualizada: {format(new Date(currentGlobalRate.date), "d MMM yyyy", { locale: es })}
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">USD → VES</CardTitle>
          </CardHeader>
          <CardContent>
            {usdToVesRate ? (
              <div>
                <p className="text-2xl font-bold">
                  ${Number(usdToVesRate.rate).toFixed(2)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(usdToVesRate.date), "d MMM yyyy", { locale: es })}
                </p>
              </div>
            ) : (
              <p className="text-muted-foreground">No hay tasa registrada</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">VES → USD</CardTitle>
          </CardHeader>
          <CardContent>
            {vesToUsdRate ? (
              <div>
                <p className="text-2xl font-bold">
                  Bs {Number(vesToUsdRate.rate).toFixed(4)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(vesToUsdRate.date), "d MMM yyyy", { locale: es })}
                </p>
              </div>
            ) : (
              <p className="text-muted-foreground">No hay tasa registrada</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Historial de Tasas</CardTitle>
          <CardDescription>Todas las tasas registradas</CardDescription>
        </CardHeader>
        <CardContent>
          {rates.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              No hay tasas registradas
            </p>
          ) : (
            <div className="space-y-2">
              {rates.map((rate) => (
                <div
                  key={rate.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex items-center gap-3">
                    {rate.isGlobal ? (
                      <Star className="h-6 w-6 fill-yellow-500 text-yellow-500" />
                    ) : (
                      <StarOff className="h-6 w-6 text-muted-foreground" />
                    )}
                    <div>
                      <p className="font-medium">
                        1 {rate.baseCurrency?.code} = {Number(rate.rate).toFixed(4)} {rate.referenceCurrency?.code}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(rate.date), "d MMM yyyy", { locale: es })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!rate.isGlobal && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSetGlobal(rate)}
                      >
                        <Star className="h-6 w-6 mr-1" />
                        Global
                      </Button>
                    )}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-500 hover:text-red-500"
                        >
                          <Trash2 className="h-6 w-6" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>¿Eliminar tasa?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta acción no se puede deshacer.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(rate.id)}>
                            Eliminar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {isOpen && (
        <ExchangeRateForm
          userId={userId}
          currencies={currencies}
          onSuccess={handleSuccess}
          onClose={() => setIsOpen(false)}
        />
      )}
    </div>
  )
}