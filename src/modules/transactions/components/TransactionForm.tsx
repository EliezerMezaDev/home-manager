"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { transactionSchema, defaultTransactionValues, type TransactionFormData } from "../utils/form-schema"
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
import type { Transaction } from "../types"
import type { Account } from "@/modules/accounts/types"
import type { Category } from "@/modules/categories/types"
import type { Beneficiary } from "@/modules/beneficiaries/types"
import type { Currency } from "@/modules/currencies/types"
import { createTransaction } from "../actions/transactions-actions"
import { toastError, toastSuccess } from "@shared/lib/toast-utils"

interface TransactionFormProps {
  userId: string
  accounts: Account[]
  categories: Category[]
  beneficiaries: Beneficiary[]
  currencies: Currency[]
  globalRate?: { rate: number; baseCurrencyId: number; referenceCurrencyId: number } | null
  transaction?: Transaction | null
  onSuccess: (transaction: Transaction) => void
  onClose: () => void
}

export function TransactionForm({
  userId,
  accounts,
  categories,
  beneficiaries,
  currencies,
  globalRate,
  transaction,
  onSuccess,
  onClose,
}: TransactionFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const form = useForm<TransactionFormData>({
    defaultValues: transaction
      ? {
          type: transaction.type as "income" | "expense" | "transfer",
          accountId: transaction.accountId,
          categoryId: transaction.categoryId,
          beneficiaryId: transaction.beneficiaryId || undefined,
          amount: Number(transaction.amount),
          currencyId: transaction.currencyId,
          exchangeRate: Number(transaction.exchangeRate),
          referenceAmount: Number(transaction.referenceAmount),
          referenceCurrencyId: transaction.referenceCurrencyId,
          description: transaction.description || undefined,
          date: transaction.date.toString(),
        }
      : defaultTransactionValues,
  })

  const selectedType = form.watch("type")
  const selectedCurrencyId = form.watch("currencyId")
  const selectedReferenceCurrencyId = form.watch("referenceCurrencyId")

  useEffect(() => {
    if (!transaction && globalRate && currencies.length >= 2) {
      const usd = currencies.find((c) => c.code === "USD")
      const ves = currencies.find((c) => c.code === "VES")
      if (usd && ves) {
        if (selectedCurrencyId === usd.id) {
          form.setValue("referenceCurrencyId", ves.id)
          form.setValue("exchangeRate", globalRate.rate)
        } else if (selectedCurrencyId === ves.id) {
          form.setValue("referenceCurrencyId", usd.id)
          form.setValue("exchangeRate", 1 / globalRate.rate)
        }
      }
    }
  }, [selectedCurrencyId, globalRate, currencies, form, transaction])

  useEffect(() => {
    const amount = form.getValues("amount")
    const rate = form.getValues("exchangeRate")
    if (amount && rate) {
      form.setValue("referenceAmount", amount * rate)
    }
  }, [form.watch("amount"), form.watch("exchangeRate")])

  const filteredCategories = categories.filter((cat) => {
    if (selectedType === "transfer") return false
    if (selectedType === "income") return cat.type === "income"
    if (selectedType === "expense") return cat.type === "expense"
    return true
  })

  const rootCategories = filteredCategories.filter((c) => c.parentId === null)
  const subcategories = filteredCategories.filter((c) => c.parentId !== null)

  const onSubmit = async (data: TransactionFormData) => {
    setIsSubmitting(true)
    setErrors({})

    const result = transactionSchema.safeParse(data)
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
      const created = await createTransaction(userId, data)
      toastSuccess("Transacción creada")
      onSuccess(created as Transaction)
    } catch (error) {
      toastError(error instanceof Error ? error.message : "Error al guardar")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Nueva Transacción</DialogTitle>
          <DialogDescription>
            Registra un ingreso, gasto o transferencia
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Tipo</Label>
            <Select
              value={form.watch("type")}
              onValueChange={(value) => form.setValue("type", value as any)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="income">Ingreso</SelectItem>
                <SelectItem value="expense">Gasto</SelectItem>
                <SelectItem value="transfer">Transferencia</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Cuenta</Label>
            <Select
              value={form.watch("accountId")}
              onValueChange={(value) => form.setValue("accountId", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona cuenta" />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.name} ({account.currency?.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.accountId && (
              <p className="text-sm text-red-500">{errors.accountId}</p>
            )}
          </div>

          {selectedType === "transfer" && (
            <div className="space-y-2">
              <Label>Cuenta Destino</Label>
              <Select
                value={form.watch("toAccountId")}
                onValueChange={(value) => form.setValue("toAccountId", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona cuenta destino" />
                </SelectTrigger>
                <SelectContent>
                  {accounts
                    .filter((a) => a.id !== form.watch("accountId"))
                    .map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.name} ({account.currency?.code})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              {errors.toAccountId && (
                <p className="text-sm text-red-500">{errors.toAccountId}</p>
              )}
            </div>
          )}

          {selectedType !== "transfer" && (
            <>
              <div className="space-y-2">
                <Label>Categoría</Label>
                <Select
                  value={form.watch("categoryId")}
                  onValueChange={(value) => form.setValue("categoryId", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {rootCategories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                    {subcategories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        ↳ {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.categoryId && (
                  <p className="text-sm text-red-500">{errors.categoryId}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Beneficiario (opcional)</Label>
                <Select
                  value={form.watch("beneficiaryId") || "none"}
                  onValueChange={(value) =>
                    form.setValue("beneficiaryId", value === "none" ? undefined : value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona beneficiario" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Ninguno</SelectItem>
                    {beneficiaries.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Moneda</Label>
              <Select
                value={form.watch("currencyId")?.toString() || ""}
                onValueChange={(value) => form.setValue("currencyId", parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Moneda" />
                </SelectTrigger>
                <SelectContent>
                  {currencies.map((currency) => (
                    <SelectItem key={currency.id} value={currency.id.toString()}>
                      {currency.code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Monto</Label>
              <Input
                type="number"
                step="0.01"
                {...form.register("amount", { valueAsNumber: true })}
                placeholder="0.00"
              />
              {errors.amount && (
                <p className="text-sm text-red-500">{errors.amount}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Referencia</Label>
              <Select
                value={form.watch("referenceCurrencyId")?.toString() || ""}
                onValueChange={(value) => form.setValue("referenceCurrencyId", parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Moneda" />
                </SelectTrigger>
                <SelectContent>
                  {currencies.map((currency) => (
                    <SelectItem key={currency.id} value={currency.id.toString()}>
                      {currency.code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tasa Cambio</Label>
              <Input
                type="number"
                step="0.01"
                {...form.register("exchangeRate", { valueAsNumber: true })}
                placeholder="1.00"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Monto Referencia</Label>
            <Input
              type="number"
              step="0.01"
              {...form.register("referenceAmount", { valueAsNumber: true })}
              readOnly
              className="bg-muted"
            />
          </div>

          <div className="space-y-2">
            <Label>Descripción (opcional)</Label>
            <Input
              {...form.register("description")}
              placeholder="Descripción de la transacción"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Guardando..." : "Crear"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}