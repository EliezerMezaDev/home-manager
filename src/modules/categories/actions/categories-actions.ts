"use server"

import { prisma } from "@shared/lib/prisma"
import { revalidatePath } from "next/cache"
import { categorySchema, type CategoryFormData } from "../utils/form-schema"
import type { Category, CategoryType } from "../types"

export async function getCategories(userId: string, type?: CategoryType) {
  const categories = await prisma.category.findMany({
    where: {
      userId,
      parentId: null,
      ...(type && { type }),
    },
    orderBy: [{ name: "asc" }],
    include: {
      children: {
        orderBy: { name: "asc" },
      },
    },
  })

  return categories as Category[]
}

export async function getRootCategories(userId: string, type?: CategoryType) {
  return prisma.category.findMany({
    where: {
      userId,
      type,
      parentId: null,
    },
    orderBy: { name: "asc" },
    include: {
      children: {
        orderBy: { name: "asc" },
      },
    },
  })
}

export async function getSubcategories(userId: string, parentId: string) {
  return prisma.category.findMany({
    where: {
      userId,
      parentId,
    },
    orderBy: { name: "asc" },
  })
}

export async function getCategoryById(id: string) {
  return prisma.category.findUnique({
    where: { id },
    include: {
      children: true,
      parent: true,
    },
  })
}

export async function createCategory(userId: string, data: CategoryFormData) {
  const validated = categorySchema.parse(data)

  if (validated.parentId) {
    const parent = await prisma.category.findUnique({
      where: { id: validated.parentId },
    })
    if (!parent) {
      throw new Error("Categoría padre no encontrada")
    }
  }

  const slug = validated.name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-")

  const category = await prisma.category.create({
    data: {
      userId,
      name: validated.name,
      slug: `${slug}-${Date.now()}`,
      type: validated.type,
      icon: validated.icon,
      parentId: validated.parentId || null,
    },
  })

  revalidatePath("/d/categories")
  return category
}

export async function updateCategory(id: string, data: Partial<CategoryFormData>) {
  const validated = categorySchema.partial().parse(data)

  if (validated.parentId === null) {
    const hasChildren = await prisma.category.count({
      where: { parentId: id },
    })
    if (hasChildren > 0) {
      throw new Error("No puedes convertir una categoría con subcategorías en raíz")
    }
  }

  const category = await prisma.category.update({
    where: { id },
    data: validated,
  })

  revalidatePath("/d/categories")
  return category
}

export async function deleteCategory(id: string) {
  const hasChildren = await prisma.category.count({
    where: { parentId: id },
  })

  if (hasChildren > 0) {
    throw new Error("Primero elimina las subcategorías")
  }

  const hasTransactions = await prisma.transaction.count({
    where: { categoryId: id },
  })

  if (hasTransactions > 0) {
    throw new Error("No puedes eliminar una categoría con transacciones")
  }

  await prisma.category.delete({
    where: { id },
  })

  revalidatePath("/d/categories")
}

function createDefaultCategories(
  userId: string,
  type: "income" | "expense",
  parents: { name: string; children: string[] }[]
) {
  const categories: { name: string; type: "income" | "expense"; parentId: string | null }[] = []

  const parentMap: Record<string, string> = {}

  for (const parent of parents) {
    const parentSlug = parent.name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, "-")

    const rootCategory = {
      name: parent.name,
      type,
      parentId: null,
      slug: `${parentSlug}-${Date.now()}`,
    }

    categories.push(rootCategory as { name: string; type: "income" | "expense"; parentId: null })
  }

  return categories
}

export async function ensureDefaultCategories(userId: string) {
  const existing = await prisma.category.findMany({
    where: { userId },
  })

  if (existing.length > 0) {
    return true
  }

  const incomeParents = [
    { name: "Salario", children: ["Salario Principal", "Bono", "Comisiones"] },
    { name: "Otros Ingresos", children: ["Regalos", "Ventas", "Intereses"] },
  ]

  const expenseParents = [
    { name: "Alimentación", children: ["Supermercado", "Restaurantes", "Delivery"] },
    { name: "Servicios Públicos", children: ["Electricidad", "Agua", "Internet", "Gas"] },
    { name: "Salud", children: ["Farmacia", "Médicos", "Seguros"] },
    { name: "Transporte", children: ["Gasolina", "Uber/Diplo", "Mantenimiento"] },
    { name: "Hogar", children: ["Mantenimiento", "Limpieza", "Decoración"] },
    { name: "Entretenimiento", children: ["Streaming", "Cines", "Eventos"] },
    { name: "Educación", children: ["Cursos", "Libros", "Inscripciones"] },
  ]

  const parentMap: Record<string, string> = {}

  for (const parent of incomeParents) {
    const slug = parent.name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, "-")

    const created = await prisma.category.create({
      data: {
        userId,
        name: parent.name,
        type: "income",
        slug: `${slug}-${Date.now()}`,
      },
    })
    parentMap[parent.name] = created.id

    for (const child of parent.children) {
      const childSlug = child
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, "-")

      await prisma.category.create({
        data: {
          userId,
          name: child,
          type: "income",
          slug: `${childSlug}-${Date.now()}`,
          parentId: created.id,
        },
      })
    }
  }

  for (const parent of expenseParents) {
    const slug = parent.name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, "-")

    const created = await prisma.category.create({
      data: {
        userId,
        name: parent.name,
        type: "expense",
        slug: `${slug}-${Date.now()}`,
      },
    })
    parentMap[parent.name] = created.id

    for (const child of parent.children) {
      const childSlug = child
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, "-")

      await prisma.category.create({
        data: {
          userId,
          name: child,
          type: "expense",
          slug: `${childSlug}-${Date.now()}`,
          parentId: created.id,
        },
      })
    }
  }

  return true
}