"use server"

import { prisma } from "@shared/lib/prisma"
import { revalidatePath } from "next/cache"
import { exchangeRateSchema, type ExchangeRateFormData } from "../utils/form-schema"

export async function getExchangeRates(userId: string) {
  return prisma.exchangeRate.findMany({
    where: { userId },
    orderBy: { date: "desc" },
    include: {
      baseCurrency: true,
      referenceCurrency: true,
    },
  })
}

export async function getGlobalExchangeRate(userId: string) {
  return prisma.exchangeRate.findFirst({
    where: { userId, isGlobal: true },
    include: {
      baseCurrency: true,
      referenceCurrency: true,
    },
    orderBy: { date: "desc" },
  })
}

export async function getExchangeRateBetween(
  userId: string,
  baseCurrencyId: number,
  referenceCurrencyId: number
) {
  const rate = await prisma.exchangeRate.findFirst({
    where: {
      userId,
      baseCurrencyId,
      referenceCurrencyId,
    },
    orderBy: { date: "desc" },
    include: {
      baseCurrency: true,
      referenceCurrency: true,
    },
  })

  if (!rate) {
    const globalRate = await prisma.exchangeRate.findFirst({
      where: { userId, isGlobal: true },
      orderBy: { date: "desc" },
    })
    return globalRate
  }

  return rate
}

export async function createExchangeRate(userId: string, data: ExchangeRateFormData) {
  const validated = exchangeRateSchema.parse(data)
  const now = new Date()
  const inverseRate = 1 / validated.rate

  if (validated.isGlobal) {
    await prisma.exchangeRate.updateMany({
      where: { userId, isGlobal: true },
      data: { isGlobal: false },
    })
  }

  const directUniqueKey = {
    userId,
    baseCurrencyId: validated.baseCurrencyId,
    referenceCurrencyId: validated.referenceCurrencyId,
  }

  const inverseUniqueKey = {
    userId,
    baseCurrencyId: validated.referenceCurrencyId,
    referenceCurrencyId: validated.baseCurrencyId,
  }

  const [directRate, inverseRateRecord] = await prisma.$transaction([
    prisma.exchangeRate.upsert({
      where: { userId_baseCurrencyId_referenceCurrencyId: directUniqueKey },
      update: {
        rate: validated.rate,
        isGlobal: validated.isGlobal,
        date: now,
      },
      create: {
        ...directUniqueKey,
        rate: validated.rate,
        isGlobal: validated.isGlobal,
      },
    }),
    prisma.exchangeRate.upsert({
      where: { userId_baseCurrencyId_referenceCurrencyId: inverseUniqueKey },
      update: {
        rate: inverseRate,
        date: now,
      },
      create: {
        ...inverseUniqueKey,
        rate: inverseRate,
        isGlobal: false,
      },
    }),
  ])

  revalidatePath("/d/exchange-rates")
  return directRate
}

export async function setGlobalExchangeRate(
  userId: string,
  baseCurrencyId: number,
  referenceCurrencyId: number,
  rate: number
) {
  await prisma.exchangeRate.updateMany({
    where: { userId, isGlobal: true },
    data: { isGlobal: false },
  })

  const existingRate = await prisma.exchangeRate.findFirst({
    where: {
      userId,
      baseCurrencyId,
      referenceCurrencyId,
    },
    orderBy: { date: "desc" },
  })

  let updatedRate

  if (existingRate) {
    updatedRate = await prisma.exchangeRate.update({
      where: { id: existingRate.id },
      data: {
        rate,
        isGlobal: true,
        date: new Date(),
      },
      include: {
        baseCurrency: true,
        referenceCurrency: true,
      },
    })
  } else {
    updatedRate = await prisma.exchangeRate.create({
      data: {
        userId,
        baseCurrencyId,
        referenceCurrencyId,
        rate,
        isGlobal: true,
      },
      include: {
        baseCurrency: true,
        referenceCurrency: true,
      },
    })
  }

  revalidatePath("/d/exchange-rates")
  return updatedRate
}

export async function deleteExchangeRate(id: string) {
  await prisma.exchangeRate.delete({
    where: { id },
  })

  revalidatePath("/d/exchange-rates")
}