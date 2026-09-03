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
import { Plus, Pencil, Trash2, Wallet, Building, CreditCard } from "lucide-react"
import { AccountForm } from "./AccountForm"
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
import type { Account } from "../types"
import type { Currency } from "@/modules/currencies/types"
import { deleteAccount } from "../actions/accounts-actions"

interface AccountsViewProps {
  initialData: Account[]
  currencies: Currency[]
  userId: string
}

const accountTypeIcons = {
  cash: Wallet,
  bank: Building,
  digital: CreditCard,
}

const accountTypeLabels = {
  cash: "Efectivo",
  bank: "Banco",
  digital: "Digital",
}

export function AccountsView({
  initialData,
  currencies,
  userId,
}: AccountsViewProps) {
  const [accounts, setAccounts] = useState<Account[]>(initialData)
  const [isOpen, setIsOpen] = useState(false)
  const [editingAccount, setEditingAccount] = useState<Account | null>(null)

  const handleSuccess = (account: Account) => {
    if (editingAccount) {
      setAccounts((prev) =>
        prev.map((a) => (a.id === account.id ? account : a))
      )
      toastSuccess("Cuenta actualizada")
    } else {
      setAccounts((prev) => [...prev, account])
      toastSuccess("Cuenta creada")
    }
    setIsOpen(false)
    setEditingAccount(null)
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteAccount(id)
      setAccounts((prev) => prev.filter((a) => a.id !== id))
      toastSuccess("Cuenta eliminada")
    } catch (error) {
      toastError(error instanceof Error ? error.message : "Error al eliminar")
    }
  }

  const accountsByCurrency = accounts.reduce((acc, account) => {
    const currencyCode = account.currency?.code || "USD"
    if (!acc[currencyCode]) {
      acc[currencyCode] = { accounts: [], total: 0 }
    }
    acc[currencyCode].accounts.push(account)
    acc[currencyCode].total += Number(account.currentBalance)
    return acc
  }, {} as Record<string, { accounts: Account[]; total: number }>)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Cuentas</h1>
          <p className="text-muted-foreground">
            Administra tus cuentas y balances
          </p>
        </div>
        <Button onClick={() => setIsOpen(true)}>
          <Plus className="mr-2 h-6 w-6" />
          Nueva Cuenta
        </Button>
      </div>

      {Object.entries(accountsByCurrency).map(([currency, data]) => (
        <div key={currency}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">{currency}</h2>
            <span className="text-lg font-bold">
              Total: {data.total.toFixed(2)} {currency}
            </span>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {data.accounts.map((account) => {
              const Icon = accountTypeIcons[account.type as keyof typeof accountTypeIcons]
              return (
                <Card key={account.id}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-lg font-medium">
                      {account.name}
                    </CardTitle>
                    <Icon className="h-6 w-6 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {accountTypeLabels[account.type as keyof typeof accountTypeLabels]}
                      {account.institution && ` - ${account.institution}`}
                    </p>
                    <p className="text-2xl font-bold mt-2">
                      {Number(account.currentBalance).toFixed(2)}{" "}
                      <span className="text-sm font-normal">
                        {account.currency?.code}
                      </span>
                    </p>
                    <div className="flex gap-2 mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingAccount(account)
                          setIsOpen(true)
                        }}
                      >
                        <Pencil className="h-6 w-6" />
                      </Button>
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
                            <AlertDialogTitle>¿Eliminar cuenta?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta acción no se puede deshacer.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(account.id)}
                            >
                              Eliminar
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      ))}

      {accounts.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10">
            <Wallet className="mb-4 h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground">No hay cuentas registradas</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => setIsOpen(true)}
            >
              Crear tu primera cuenta
            </Button>
          </CardContent>
        </Card>
      )}

      {isOpen && (
        <AccountForm
          userId={userId}
          currencies={currencies}
          account={editingAccount}
          onSuccess={handleSuccess}
          onClose={() => {
            setIsOpen(false)
            setEditingAccount(null)
          }}
        />
      )}
    </div>
  )
}