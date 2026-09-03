"use server"

import { prisma } from "@shared/lib/prisma"
import { revalidatePath } from "next/cache"
import { beneficiarySchema, type BeneficiaryFormData } from "../utils/form-schema"

export async function getBeneficiaries(userId: string) {
  return prisma.beneficiary.findMany({
    where: { userId },
    orderBy: { name: "asc" },
  })
}

export async function getBeneficiaryById(id: string) {
  return prisma.beneficiary.findUnique({
    where: { id },
    include: {
      transactions: {
        orderBy: { date: "desc" },
        take: 20,
        include: {
          account: true,
          category: true,
        },
      },
    },
  })
}

export async function createBeneficiary(userId: string, data: BeneficiaryFormData) {
  const validated = beneficiarySchema.parse(data)

  const slug = validated.name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-")

  const existing = await prisma.beneficiary.findFirst({
    where: {
      userId,
      name: validated.name,
    },
  })

  if (existing) {
    throw new Error("Ya existe un beneficiario con este nombre")
  }

  const beneficiary = await prisma.beneficiary.create({
    data: {
      userId,
      name: validated.name,
      slug: `${slug}-${Date.now()}`,
      type: validated.type || null,
      phone: validated.phone || null,
      email: validated.email || null,
      notes: validated.notes || null,
    },
  })

  revalidatePath("/d/beneficiaries")
  return beneficiary
}

export async function updateBeneficiary(id: string, data: Partial<BeneficiaryFormData>) {
  const validated = beneficiarySchema.partial().parse(data)

  const beneficiary = await prisma.beneficiary.update({
    where: { id },
    data: validated,
  })

  revalidatePath("/d/beneficiaries")
  return beneficiary
}

export async function deleteBeneficiary(id: string) {
  const hasTransactions = await prisma.transaction.count({
    where: { beneficiaryId: id },
  })

  if (hasTransactions > 0) {
    throw new Error("No puedes eliminar un beneficiario con transacciones")
  }

  await prisma.beneficiary.delete({
    where: { id },
  })

  revalidatePath("/d/beneficiaries")
}

export async function getBeneficiaryTransactions(id: string) {
  return prisma.transaction.findMany({
    where: { beneficiaryId: id },
    orderBy: { date: "desc" },
    include: {
      account: true,
      category: true,
    },
  })
}