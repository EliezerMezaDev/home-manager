"use server"

import { prisma } from "@shared/lib/prisma"
import { revalidatePath } from "next/cache"
import { currencySchema, type CurrencyFormData } from "../utils/form-schema"

export async function getCurrencies(userId: string) {
  return prisma.currency.findMany({
    where: { userId },
    orderBy: { code: "asc" },
  })
}

export async function createCurrency(userId: string, data: CurrencyFormData) {
  const validated = currencySchema.parse(data)

  const currency = await prisma.currency.create({
    data: {
      userId,
      code: validated.code,
      name: validated.name,
      symbol: validated.symbol,
      isCrypto: validated.isCrypto || false,
    },
  })

  revalidatePath("/d/currencies")
  return currency
}

export async function updateCurrency(
  id: number,
  data: Partial<CurrencyFormData>
) {
  const validated = currencySchema.partial().parse(data)

  const currency = await prisma.currency.update({
    where: { id },
    data: validated,
  })

  revalidatePath("/d/currencies")
  return currency
}

export async function deleteCurrency(id: number) {
  await prisma.currency.delete({
    where: { id },
  })

  revalidatePath("/d/currencies")
}

export async function ensureDefaultCurrencies(userId: string) {
  const existing = await prisma.currency.findMany({
    where: { userId },
  })

  if (existing.length === 0) {
    await prisma.currency.createMany({
      data: [
        {
          userId,
          code: "USD",
          name: "Dólar Estadounidense",
          symbol: "$",
          isCrypto: false,
        },
        {
          userId,
          code: "VES",
          name: "Bolívar Venezolano",
          symbol: "Bs",
          isCrypto: false,
        },
      ],
    })
  }

  return true
}
