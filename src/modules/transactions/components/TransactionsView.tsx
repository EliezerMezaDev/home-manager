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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shadcn/components/ui/select"
import { Plus, Trash2, ArrowUpRight, ArrowDownRight, ArrowRight } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { TransactionForm } from "./TransactionForm"
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
import type { Transaction, TransactionFilters } from "../types"
import type { Account } from "@/modules/accounts/types"
import type { Category } from "@/modules/categories/types"
import type { Beneficiary } from "@/modules/beneficiaries/types"
import type { Currency } from "@/modules/currencies/types"
import { deleteTransaction } from "../actions/transactions-actions"

interface TransactionsViewProps {
  initialData: Transaction[]
  accounts: Account[]
  categories: Category[]
  beneficiaries: Beneficiary[]
  currencies: Currency[]
  globalRate?: { rate: number; baseCurrencyId: number; referenceCurrencyId: number } | null
  userId: string
}

const typeLabels = {
  income: "Ingreso",
  expense: "Gasto",
  transfer: "Transferencia",
}

const typeColors = {
  income: "text-green-600",
  expense: "text-red-600",
  transfer: "text-blue-600",
}

const typeIcons = {
  income: ArrowDownRight,
  expense: ArrowUpRight,
  transfer: ArrowRight,
}

export function TransactionsView({
  initialData,
  accounts,
  categories,
  beneficiaries,
  currencies,
  globalRate,
  userId,
}: TransactionsViewProps) {
  const [transactions, setTransactions] = useState<Transaction[]>(initialData)
  const [isOpen, setIsOpen] = useState(false)
  const [filters, setFilters] = useState<TransactionFilters>({})

  const handleSuccess = (transaction: Transaction) => {
    setTransactions((prev) => [transaction, ...prev])
    setIsOpen(false)
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteTransaction(id)
      setTransactions((prev) => prev.filter((t) => t.id !== id))
      toastSuccess("Transacción eliminada")
    } catch (error) {
      toastError(error instanceof Error ? error.message : "Error al eliminar")
    }
  }

  const filteredTransactions = transactions.filter((tx) => {
    if (filters.accountId && tx.accountId !== filters.accountId) return false
    if (filters.categoryId && tx.categoryId !== filters.categoryId) return false
    if (filters.type && tx.type !== filters.type) return false
    return true
  })

  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + Number(t.amount), 0)

  const totalExpense = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + Number(t.amount), 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Transacciones</h1>
          <p className="text-muted-foreground">
            Registra y gestiona tus transacciones
          </p>
        </div>
        <Button onClick={() => setIsOpen(true)}>
          <Plus className="mr-2 h-6 w-6" />
          Nueva Transacción
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Ingresos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              +{totalIncome.toFixed(2)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Gastos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              -{totalExpense.toFixed(2)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${totalIncome - totalExpense >= 0 ? "text-green-600" : "text-red-600"}`}>
              {(totalIncome - totalExpense).toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-2 flex-wrap">
        <Select
          value={filters.type || "all"}
          onValueChange={(value) => setFilters({ ...filters, type: value === "all" ? undefined : value as any })}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="income">Ingresos</SelectItem>
            <SelectItem value="expense">Gastos</SelectItem>
            <SelectItem value="transfer">Transferencias</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filters.accountId || "all"}
          onValueChange={(value) => setFilters({ ...filters, accountId: value === "all" ? undefined : value })}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Cuenta" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las cuentas</SelectItem>
            {accounts.map((account) => (
              <SelectItem key={account.id} value={account.id}>
                {account.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Historial</CardTitle>
          <CardDescription>{filteredTransactions.length} transacciones</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredTransactions.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              No hay transacciones
            </p>
          ) : (
            <div className="space-y-2">
              {filteredTransactions.map((tx) => {
                const Icon = typeIcons[tx.type as keyof typeof typeIcons]
                return (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`rounded-full p-2 ${tx.type === "income" ? "bg-green-100" : tx.type === "expense" ? "bg-red-100" : "bg-blue-100"}`}>
                        <Icon className={`h-6 w-6 ${typeColors[tx.type as keyof typeof typeColors]}`} />
                      </div>
                      <div>
                        <p className="font-medium">
                          {tx.category?.name || "Sin categoría"}
                          {tx.beneficiary && ` - ${tx.beneficiary.name}`}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {tx.account?.name} • {format(new Date(tx.date), "d MMM", { locale: es })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className={`font-medium ${typeColors[tx.type as keyof typeof typeColors]}`}>
                          {tx.type === "income" ? "+" : tx.type === "expense" ? "-" : ""}
                          {Number(tx.amount).toFixed(2)} {tx.currency?.code}
                        </p>
                        {tx.type !== "transfer" && (
                          <p className="text-xs text-muted-foreground">
                            = {Number(tx.referenceAmount).toFixed(2)} {tx.referenceCurrencyId === 1 ? "USD" : "VES"}
                          </p>
                        )}
                      </div>
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
                            <AlertDialogTitle>¿Eliminar transacción?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta acción revertirá los cambios en el saldo de la cuenta.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(tx.id)}>
                              Eliminar
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {isOpen && (
        <TransactionForm
          userId={userId}
          accounts={accounts}
          categories={categories}
          beneficiaries={beneficiaries}
          currencies={currencies}
          globalRate={globalRate}
          onSuccess={handleSuccess}
          onClose={() => setIsOpen(false)}
        />
      )}
    </div>
  )
}