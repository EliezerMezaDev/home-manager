"use server"

import { prisma } from "@shared/lib/prisma"
import { revalidatePath } from "next/cache"
import { accountSchema, type AccountFormData } from "../utils/form-schema"

export async function getAccounts(userId: string) {
  return prisma.account.findMany({
    where: { userId },
    orderBy: { name: "asc" },
    include: {
      currency: true,
    },
  })
}

export async function getAccountById(id: string) {
  return prisma.account.findUnique({
    where: { id },
    include: {
      currency: true,
      transactions: {
        orderBy: { date: "desc" },
        take: 10,
        include: {
          category: true,
        },
      },
    },
  })
}

export async function createAccount(userId: string, data: AccountFormData) {
  const validated = accountSchema.parse(data)

  const existing = await prisma.account.findFirst({
    where: {
      userId,
      name: validated.name,
      currencyId: validated.currencyId,
    },
  })

  if (existing) {
    throw new Error("Ya existe una cuenta con este nombre y moneda")
  }

  const account = await prisma.account.create({
    data: {
      userId,
      name: validated.name,
      currencyId: validated.currencyId,
      institution: validated.institution || null,
      type: validated.type,
      initialBalance: validated.initialBalance,
      currentBalance: validated.initialBalance,
    },
    include: {
      currency: true,
    },
  })

  revalidatePath("/d/accounts")
  return account
}

export async function updateAccount(id: string, data: Partial<AccountFormData>) {
  const validated = accountSchema.partial().parse(data)

  const account = await prisma.account.update({
    where: { id },
    data: validated,
    include: {
      currency: true,
    },
  })

  revalidatePath("/d/accounts")
  return account
}

export async function deleteAccount(id: string) {
  const hasTransactions = await prisma.transaction.count({
    where: { accountId: id },
  })

  if (hasTransactions > 0) {
    throw new Error("No puedes eliminar una cuenta con transacciones")
  }

  await prisma.account.delete({
    where: { id },
  })

  revalidatePath("/d/accounts")
}

export async function updateAccountBalance(
  accountId: string,
  amount: number,
  operation: "increment" | "decrement"
) {
  const account = await prisma.account.findUnique({
    where: { id: accountId },
  })

  if (!account) {
    throw new Error("Cuenta no encontrada")
  }

  const newBalance =
    operation === "increment"
      ? Number(account.currentBalance) + amount
      : Number(account.currentBalance) - amount

  if (newBalance < 0) {
    throw new Error("El saldo no puede ser negativo")
  }

  await prisma.account.update({
    where: { id: accountId },
    data: { currentBalance: newBalance },
  })

  revalidatePath("/d/accounts")
}

export async function getAccountStats(userId: string) {
  const accounts = await prisma.account.findMany({
    where: { userId },
    include: {
      currency: true,
    },
  })

  const totalByCurrency: Record<string, number> = {}

  for (const account of accounts) {
    const currencyCode = account.currency?.code || "USD"
    if (!totalByCurrency[currencyCode]) {
      totalByCurrency[currencyCode] = 0
    }
    totalByCurrency[currencyCode] += Number(account.currentBalance)
  }

  return {
    totalAccounts: accounts.length,
    totalByCurrency,
  }
}