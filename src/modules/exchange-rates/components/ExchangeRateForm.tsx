"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { exchangeRateSchema, defaultExchangeRateValues, type ExchangeRateFormData } from "../utils/form-schema"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@shadcn/components/ui/dialog"
import { Button } from "@shadcn/components/ui/button"
import { Input } from "@shadcn/components/ui/input"
import { Label } from "@shadcn/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shadcn/components/ui/select"
import type { ExchangeRate } from "../types"
import type { Currency } from "@/modules/currencies/types"
import { createExchangeRate } from "../actions/exchange-rates-actions"
import { toastError, toastSuccess } from "@shared/lib/toast-utils"

interface ExchangeRateFormProps {
  userId: string
  currencies: Currency[]
  exchangeRate?: ExchangeRate | null
  onSuccess: (exchangeRate: ExchangeRate) => void
  onClose: () => void
}

export function ExchangeRateForm({
  userId,
  currencies,
  exchangeRate,
  onSuccess,
  onClose,
}: ExchangeRateFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const form = useForm<ExchangeRateFormData>({
    defaultValues: exchangeRate
      ? {
          baseCurrencyId: exchangeRate.baseCurrencyId,
          referenceCurrencyId: exchangeRate.referenceCurrencyId,
          rate: Number(exchangeRate.rate),
          isGlobal: exchangeRate.isGlobal,
        }
      : defaultExchangeRateValues,
  })

  const onSubmit = async (data: ExchangeRateFormData) => {
    setIsSubmitting(true)
    setErrors({})

    const result = exchangeRateSchema.safeParse(data)
    if (!result.success) {
      const fieldErrors: Record<string, string> = {}
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message
        }
      })
      setErrors(fieldErrors)
      setIsSubmitting(false)
      return
    }

    try {
      const created = await createExchangeRate(userId, data)
      toastSuccess("Tasa de cambio guardada")
      onSuccess(created as ExchangeRate)
    } catch (error) {
      toastError(error instanceof Error ? error.message : "Error al guardar")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nueva Tasa de Cambio</DialogTitle>
          <DialogDescription>
            Registra la tasa de cambio del día
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Moneda Base</Label>
            <Select
              value={form.watch("baseCurrencyId")?.toString() || ""}
              onValueChange={(value) => form.setValue("baseCurrencyId", parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona moneda base" />
              </SelectTrigger>
              <SelectContent>
                {currencies.map((currency) => (
                  <SelectItem key={currency.id} value={currency.id.toString()}>
                    {currency.code} - {currency.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.baseCurrencyId && (
              <p className="text-sm text-red-500">{errors.baseCurrencyId}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Moneda de Referencia</Label>
            <Select
              value={form.watch("referenceCurrencyId")?.toString() || ""}
              onValueChange={(value) => form.setValue("referenceCurrencyId", parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona moneda de referencia" />
              </SelectTrigger>
              <SelectContent>
                {currencies.map((currency) => (
                  <SelectItem key={currency.id} value={currency.id.toString()}>
                    {currency.code} - {currency.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.referenceCurrencyId && (
              <p className="text-sm text-red-500">{errors.referenceCurrencyId}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="rate">Tasa de Cambio</Label>
            <Input
              id="rate"
              type="number"
              step="0.01"
              min="0"
              {...form.register("rate", { valueAsNumber: true })}
              placeholder="Ej: 36.50"
            />
            {errors.rate && (
              <p className="text-sm text-red-500">{errors.rate}</p>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="isGlobal"
              checked={form.watch("isGlobal")}
              onChange={(e) => form.setValue("isGlobal", e.target.checked)}
              className="h-6 w-6"
            />
            <Label htmlFor="isGlobal">Usar como tasa global por defecto</Label>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Guardando..." : "Guardar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}