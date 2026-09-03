"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { accountSchema, defaultAccountValues, type AccountFormData } from "../utils/form-schema"
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
import type { Account } from "../types"
import type { Currency } from "@/modules/currencies/types"
import { createAccount, updateAccount } from "../actions/accounts-actions"
import { toastError, toastSuccess } from "@shared/lib/toast-utils"

interface AccountFormProps {
  userId: string
  currencies: Currency[]
  account?: Account | null
  onSuccess: (account: Account) => void
  onClose: () => void
}

export function AccountForm({
  userId,
  currencies,
  account,
  onSuccess,
  onClose,
}: AccountFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const form = useForm<AccountFormData>({
    defaultValues: account
      ? {
          name: account.name,
          currencyId: account.currencyId,
          institution: account.institution || "",
          type: account.type as any,
          initialBalance: Number(account.initialBalance),
        }
      : defaultAccountValues,
  })

  const onSubmit = async (data: AccountFormData) => {
    setIsSubmitting(true)
    setErrors({})

    const result = accountSchema.safeParse(data)
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
      if (account) {
        const updated = await updateAccount(account.id, data)
        toastSuccess("Cuenta actualizada")
        onSuccess(updated as Account)
      } else {
        const created = await createAccount(userId, data)
        toastSuccess("Cuenta creada")
        onSuccess(created as Account)
      }
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
          <DialogTitle>
            {account ? "Editar Cuenta" : "Nueva Cuenta"}
          </DialogTitle>
          <DialogDescription>
            {account
              ? "Modifica los detalles de la cuenta"
              : "Crea una nueva cuenta para registrar transacciones"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre</Label>
            <Input
              id="name"
              {...form.register("name")}
              placeholder="Ej: Cuenta Principal"
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Tipo de Cuenta</Label>
            <Select
              value={form.watch("type")}
              onValueChange={(value) => form.setValue("type", value as any)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Efectivo</SelectItem>
                <SelectItem value="bank">Banco</SelectItem>
                <SelectItem value="digital">Digital (Zelle, Pago Móvil)</SelectItem>
              </SelectContent>
            </Select>
            {errors.type && (
              <p className="text-sm text-red-500">{errors.type}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Moneda</Label>
            <Select
              value={form.watch("currencyId")?.toString() || ""}
              onValueChange={(value) => form.setValue("currencyId", parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona moneda" />
              </SelectTrigger>
              <SelectContent>
                {currencies.map((currency) => (
                  <SelectItem key={currency.id} value={currency.id.toString()}>
                    {currency.code} - {currency.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.currencyId && (
              <p className="text-sm text-red-500">{errors.currencyId}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="institution">Institución (opcional)</Label>
            <Input
              id="institution"
              {...form.register("institution")}
              placeholder="Ej: Banco de Venezuela"
            />
          </div>

          {!account && (
            <div className="space-y-2">
              <Label htmlFor="initialBalance">Saldo Inicial</Label>
              <Input
                id="initialBalance"
                type="number"
                step="0.01"
                {...form.register("initialBalance", { valueAsNumber: true })}
                defaultValue={0}
              />
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Guardando..." : account ? "Actualizar" : "Crear"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}