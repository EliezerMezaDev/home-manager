"use server"

import { prisma } from "@shared/lib/prisma"
import { revalidatePath } from "next/cache"
import { transactionSchema, type TransactionFormData } from "../utils/form-schema"

export async function getTransactions(userId: string, filters?: {
  accountId?: string
  categoryId?: string
  type?: string
  startDate?: Date
  endDate?: Date
}) {
  return prisma.transaction.findMany({
    where: {
      userId,
      ...(filters?.accountId && { accountId: filters.accountId }),
      ...(filters?.categoryId && { categoryId: filters.categoryId }),
      ...(filters?.type && { type: filters.type }),
      ...(filters?.startDate && filters?.endDate && {
        date: {
          gte: filters.startDate,
          lte: filters.endDate,
        },
      }),
    },
    orderBy: { date: "desc" },
    include: {
      account: {
        include: { currency: true },
      },
      category: true,
      beneficiary: true,
      currency: true,
    },
  })
}

export async function getTransactionById(id: string) {
  return prisma.transaction.findUnique({
    where: { id },
    include: {
      account: { include: { currency: true } },
      category: true,
      beneficiary: true,
      currency: true,
    },
  })
}

export async function createTransaction(userId: string, data: TransactionFormData) {
  const validated = transactionSchema.parse(data)

  const amount = validated.amount
  const referenceAmount = validated.amount * validated.exchangeRate

  const transaction = await prisma.transaction.create({
    data: {
      userId,
      accountId: validated.accountId,
      categoryId: validated.categoryId,
      beneficiaryId: validated.beneficiaryId || null,
      type: validated.type,
      amount,
      currencyId: validated.currencyId,
      exchangeRate: validated.exchangeRate,
      referenceAmount,
      referenceCurrencyId: validated.referenceCurrencyId,
      description: validated.description || null,
      date: validated.date ? new Date(validated.date) : new Date(),
    },
    include: {
      account: { include: { currency: true } },
      category: true,
      beneficiary: true,
      currency: true,
    },
  })

  const account = await prisma.account.findUnique({
    where: { id: validated.accountId },
  })

  if (!account) {
    throw new Error("Cuenta no encontrada")
  }

  if (validated.type === "expense" || validated.type === "transfer") {
    const newBalance = Number(account.currentBalance) - amount
    if (newBalance < 0) {
      await prisma.transaction.delete({ where: { id: transaction.id } })
      throw new Error("Saldo insuficiente")
    }
    await prisma.account.update({
      where: { id: validated.accountId },
      data: { currentBalance: newBalance },
    })
  } else if (validated.type === "income") {
    await prisma.account.update({
      where: { id: validated.accountId },
      data: { currentBalance: { increment: amount } },
    })
  }

  if (validated.type === "transfer" && validated.toAccountId) {
    const toAccount = await prisma.account.findUnique({
      where: { id: validated.toAccountId },
    })

    if (toAccount) {
      await prisma.account.update({
        where: { id: validated.toAccountId },
        data: { currentBalance: { increment: amount } },
      })
    }
  }

  revalidatePath("/d/transactions")
  revalidatePath("/d/accounts")
  return transaction
}

export async function updateTransaction(id: string, data: Partial<TransactionFormData>) {
  const transaction = await prisma.transaction.update({
    where: { id },
    data: data as any,
    include: {
      account: { include: { currency: true } },
      category: true,
      beneficiary: true,
      currency: true,
    },
  })

  revalidatePath("/d/transactions")
  return transaction
}

export async function deleteTransaction(id: string) {
  const transaction = await prisma.transaction.findUnique({
    where: { id },
  })

  if (!transaction) {
    throw new Error("Transacción no encontrada")
  }

  const account = await prisma.account.findUnique({
    where: { id: transaction.accountId },
  })

  if (account) {
    if (transaction.type === "expense" || transaction.type === "transfer") {
      await prisma.account.update({
        where: { id: transaction.accountId },
        data: { currentBalance: { increment: Number(transaction.amount) } },
      })
    } else if (transaction.type === "income") {
      const newBalance = Number(account.currentBalance) - Number(transaction.amount)
      await prisma.account.update({
        where: { id: transaction.accountId },
        data: { currentBalance: newBalance },
      })
    }
  }

  await prisma.transaction.delete({
    where: { id },
  })

  revalidatePath("/d/transactions")
  revalidatePath("/d/accounts")
}

export async function getTransactionStats(userId: string, period?: "month" | "year") {
  const now = new Date()
  let startDate: Date

  if (period === "month") {
    startDate = new Date(now.getFullYear(), now.getMonth(), 1)
  } else {
    startDate = new Date(now.getFullYear(), 0, 1)
  }

  const transactions = await prisma.transaction.findMany({
    where: {
      userId,
      date: { gte: startDate },
    },
    include: {
      category: true,
    },
  })

  let totalIncome = 0
  let totalExpense = 0

  const byCategoryMap: Record<string, { name: string; total: number }> = {}

  for (const tx of transactions) {
    if (tx.type === "income") {
      totalIncome += Number(tx.referenceAmount)
    } else if (tx.type === "expense") {
      totalExpense += Number(tx.referenceAmount)

      const catName = tx.category?.name || "Sin categoría"
      if (!byCategoryMap[tx.categoryId]) {
        byCategoryMap[tx.categoryId] = { name: catName, total: 0 }
      }
      byCategoryMap[tx.categoryId].total += Number(tx.referenceAmount)
    }
  }

  return {
    totalIncome,
    totalExpense,
    balance: totalIncome - totalExpense,
    byCategory: Object.entries(byCategoryMap).map(([id, data]) => ({
      categoryId: id,
      categoryName: data.name,
      total: data.total,
    })),
  }
}