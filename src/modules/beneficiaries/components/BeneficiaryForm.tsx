"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { beneficiarySchema, defaultBeneficiaryValues, type BeneficiaryFormData } from "../utils/form-schema"
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
import type { Beneficiary } from "../types"
import { createBeneficiary, updateBeneficiary } from "../actions/beneficiaries-actions"
import { toastError, toastSuccess } from "@shared/lib/toast-utils"

interface BeneficiaryFormProps {
  userId: string
  beneficiary?: Beneficiary | null
  onSuccess: (beneficiary: Beneficiary) => void
  onClose: () => void
}

export function BeneficiaryForm({
  userId,
  beneficiary,
  onSuccess,
  onClose,
}: BeneficiaryFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const form = useForm<BeneficiaryFormData>({
    defaultValues: beneficiary
      ? {
          name: beneficiary.name,
          type: beneficiary.type || undefined,
          phone: beneficiary.phone || undefined,
          email: beneficiary.email || undefined,
          notes: beneficiary.notes || undefined,
        }
      : defaultBeneficiaryValues,
  })

  const onSubmit = async (data: BeneficiaryFormData) => {
    setIsSubmitting(true)
    setErrors({})

    const result = beneficiarySchema.safeParse(data)
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
      if (beneficiary) {
        const updated = await updateBeneficiary(beneficiary.id, data)
        toastSuccess("Beneficiario actualizado")
        onSuccess(updated as Beneficiary)
      } else {
        const created = await createBeneficiary(userId, data)
        toastSuccess("Beneficiario creado")
        onSuccess(created as Beneficiary)
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
            {beneficiary ? "Editar Beneficiario" : "Nuevo Beneficiario"}
          </DialogTitle>
          <DialogDescription>
            {beneficiary
              ? "Modifica los detalles del beneficiario"
              : "Agrega un nuevo beneficiario para tus transacciones"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre</Label>
            <Input
              id="name"
              {...form.register("name")}
              placeholder="Ej: Supermercado Expreso"
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Tipo</Label>
            <Select
              value={form.watch("type") || "none"}
              onValueChange={(value) =>
                form.setValue("type", value === "none" ? undefined : value as "individual" | "company")
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No definido</SelectItem>
                <SelectItem value="individual">Individual</SelectItem>
                <SelectItem value="company">Empresa</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Teléfono</Label>
            <Input
              id="phone"
              {...form.register("phone")}
              placeholder="Ej: +58 412 123 4567"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              {...form.register("email")}
              placeholder="ejemplo@correo.com"
            />
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notas</Label>
            <Input
              id="notes"
              {...form.register("notes")}
              placeholder="Notas adicionales"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Guardando..." : beneficiary ? "Actualizar" : "Crear"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}