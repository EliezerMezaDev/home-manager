"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import {
  currencySchema,
  type CurrencyFormData,
  defaultCurrencyValues,
} from "../utils/form-schema"
import { Currency } from "../types"
import { Button } from "@shadcn/components/ui/button"
import { Input } from "@shadcn/components/ui/input"
import { Checkbox } from "@shadcn/components/ui/checkbox"
import { Label } from "@shadcn/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@shadcn/components/ui/dialog"

interface CurrencyFormProps {
  userId: string
  currency?: Currency | null
  onSuccess: (currency: Currency) => void
  onClose: () => void
}

export function CurrencyForm({
  userId,
  currency,
  onSuccess,
  onClose,
}: CurrencyFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const form = useForm<CurrencyFormData>({
    defaultValues: currency
      ? {
          code: currency.code,
          name: currency.name,
          symbol: currency.symbol,
          isCrypto: currency.isCrypto,
        }
      : defaultCurrencyValues,
  })

  const onSubmit = async (data: CurrencyFormData) => {
    setErrors({})

    const result = currencySchema.safeParse(data)
    if (!result.success) {
      const fieldErrors: Record<string, string> = {}
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message
        }
      })
      setErrors(fieldErrors)
      return
    }

    setIsLoading(true)
    try {
      if (currency) {
        const { updateCurrency } = await import("../actions/currencies-actions")
        const updated = await updateCurrency(currency.id, data)
        onSuccess({ ...currency, ...updated })
      } else {
        const { createCurrency } = await import("../actions/currencies-actions")
        const created = await createCurrency(userId, data)
        onSuccess(created)
      }
    } catch (error) {
      console.error("Error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {currency ? "Editar Moneda" : "Nueva Moneda"}
          </DialogTitle>
          <DialogDescription>
            {currency
              ? "Actualiza los datos de la moneda"
              : "Agrega una nueva moneda a tu hogar"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="code">Código</Label>
            <Input id="code" placeholder="USD" {...form.register("code")} />
            {errors.code && (
              <p className="text-sm text-red-500">{errors.code}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Nombre</Label>
            <Input
              id="name"
              placeholder="Dólar Estadounidense"
              {...form.register("name")}
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="symbol">Símbolo</Label>
            <Input id="symbol" placeholder="$" {...form.register("symbol")} />
            {errors.symbol && (
              <p className="text-sm text-red-500">{errors.symbol}</p>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="isCrypto"
              checked={form.watch("isCrypto")}
              onCheckedChange={(checked) =>
                form.setValue("isCrypto", checked as boolean)
              }
            />
            <Label htmlFor="isCrypto">¿Es criptomoneda?</Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
