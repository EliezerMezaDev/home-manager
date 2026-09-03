"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { categorySchema, defaultCategoryValues, type CategoryFormData } from "../utils/form-schema"
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
import type { Category, CategoryType } from "../types"
import { createCategory, updateCategory } from "../actions/categories-actions"
import { toastError, toastSuccess } from "@shared/lib/toast-utils"

interface CategoryFormProps {
  userId: string
  category: Category | null
  categories: Category[]
  onSuccess: (category: Category) => void
  onClose: () => void
}

export function CategoryForm({
  userId,
  category,
  categories,
  onSuccess,
  onClose,
}: CategoryFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedIcon, setSelectedIcon] = useState(category?.icon || "Tag")
  const [formType, setFormType] = useState<CategoryType>(category?.type || "expense")
  const [errors, setErrors] = useState<Record<string, string>>({})

  const form = useForm<CategoryFormData>({
    defaultValues: category
      ? {
          name: category.name,
          type: category.type,
          icon: category.icon || undefined,
          parentId: category.parentId || undefined,
        }
      : defaultCategoryValues,
  })

  const rootCategories = categories.filter((c) => c.parentId === null && c.type === formType)

  const onSubmit = async (data: CategoryFormData) => {
    setIsSubmitting(true)
    setErrors({})

    const result = categorySchema.safeParse(data)
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
      const icon = selectedIcon || undefined

      if (category) {
        const updated = await updateCategory(category.id, { ...data, icon })
        toastSuccess("Categoría actualizada")
        onSuccess(updated as Category)
      } else {
        const created = await createCategory(userId, { ...data, icon })
        toastSuccess("Categoría creada")
        onSuccess(created as Category)
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
            {category ? "Editar Categoría" : "Nueva Categoría"}
          </DialogTitle>
          <DialogDescription>
            {category
              ? "Modifica los detalles de la categoría"
              : "Crea una nueva categoría o subcategoría"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre</Label>
            <Input
              id="name"
              {...form.register("name")}
              placeholder="Ej: Supermercado"
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Tipo</Label>
            <Select
              value={form.watch("type")}
              onValueChange={(value) => {
                form.setValue("type", value as CategoryType)
                setFormType(value as CategoryType)
                form.setValue("parentId", undefined)
              }}
              disabled={!!category}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="income">Ingreso</SelectItem>
                <SelectItem value="expense">Gasto</SelectItem>
              </SelectContent>
            </Select>
            {errors.type && (
              <p className="text-sm text-red-500">{errors.type}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Categoría Padre (opcional)</Label>
            <Select
              value={form.watch("parentId") || "none"}
              onValueChange={(value) => {
                form.setValue("parentId", value === "none" ? undefined : value)
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona categoría padre" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Ninguna (categoría raíz)</SelectItem>
                {rootCategories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Icono</Label>
            <Input
              value={selectedIcon}
              onChange={(e) => setSelectedIcon(e.target.value)}
              placeholder="Ej: Tag, Wallet, Car"
            />
            <p className="text-xs text-muted-foreground">
              Ingresa el nombre de un icono de Lucide React
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Guardando..." : category ? "Actualizar" : "Crear"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}