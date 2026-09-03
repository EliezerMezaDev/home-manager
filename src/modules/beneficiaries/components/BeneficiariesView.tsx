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
import { Plus, Pencil, Trash2, Users, Building2, User } from "lucide-react"
import { BeneficiaryForm } from "./BeneficiaryForm"
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
import type { Beneficiary } from "../types"
import { deleteBeneficiary } from "../actions/beneficiaries-actions"

interface BeneficiariesViewProps {
  initialData: Beneficiary[]
  userId: string
}

const typeIcons = {
  individual: User,
  company: Building2,
  null: User,
}

const typeLabels = {
  individual: "Individual",
  company: "Empresa",
  null: "No definido",
}

export function BeneficiariesView({
  initialData,
  userId,
}: BeneficiariesViewProps) {
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>(initialData)
  const [isOpen, setIsOpen] = useState(false)
  const [editingBeneficiary, setEditingBeneficiary] = useState<Beneficiary | null>(null)

  const handleSuccess = (beneficiary: Beneficiary) => {
    if (editingBeneficiary) {
      setBeneficiaries((prev) =>
        prev.map((b) => (b.id === beneficiary.id ? beneficiary : b))
      )
      toastSuccess("Beneficiario actualizado")
    } else {
      setBeneficiaries((prev) => [...prev, beneficiary])
      toastSuccess("Beneficiario creado")
    }
    setIsOpen(false)
    setEditingBeneficiary(null)
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteBeneficiary(id)
      setBeneficiaries((prev) => prev.filter((b) => b.id !== id))
      toastSuccess("Beneficiario eliminado")
    } catch (error) {
      toastError(error instanceof Error ? error.message : "Error al eliminar")
    }
  }

  const individuals = beneficiaries.filter((b) => b.type === "individual" || !b.type)
  const companies = beneficiaries.filter((b) => b.type === "company")

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Beneficiarios</h1>
          <p className="text-muted-foreground">
            Administra los beneficiarios de tus transacciones
          </p>
        </div>
        <Button onClick={() => setIsOpen(true)}>
          <Plus className="mr-2 h-6 w-6" />
          Nuevo Beneficiario
        </Button>
      </div>

      {beneficiaries.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10">
            <Users className="mb-4 h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground">No hay beneficiarios registrados</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => setIsOpen(true)}
            >
              Crear tu primer beneficiario
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {companies.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-4">Empresas</h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {companies.map((beneficiary) => {
                  const Icon = typeIcons[beneficiary.type as keyof typeof typeIcons] || User
                  return (
                    <Card key={beneficiary.id}>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-lg font-medium">
                          {beneficiary.name}
                        </CardTitle>
                        <Icon className="h-6 w-6 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <CardDescription className="mb-2">
                          {beneficiary.email || "Sin email"}
                        </CardDescription>
                        {beneficiary.phone && (
                          <p className="text-sm text-muted-foreground mb-2">
                            {beneficiary.phone}
                          </p>
                        )}
                        <div className="flex gap-2 mt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingBeneficiary(beneficiary)
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
                                <AlertDialogTitle>¿Eliminar beneficiario?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Esta acción no se puede deshacer.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(beneficiary.id)}>
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
          )}

          {individuals.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-4">Individuales</h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {individuals.map((beneficiary) => {
                  const Icon = typeIcons[beneficiary.type as keyof typeof typeIcons] || User
                  return (
                    <Card key={beneficiary.id}>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-lg font-medium">
                          {beneficiary.name}
                        </CardTitle>
                        <Icon className="h-6 w-6 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <CardDescription className="mb-2">
                          {beneficiary.email || "Sin email"}
                        </CardDescription>
                        {beneficiary.phone && (
                          <p className="text-sm text-muted-foreground mb-2">
                            {beneficiary.phone}
                          </p>
                        )}
                        <div className="flex gap-2 mt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingBeneficiary(beneficiary)
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
                                <AlertDialogTitle>¿Eliminar beneficiario?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Esta acción no se puede deshacer.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(beneficiary.id)}>
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
          )}
        </div>
      )}

      {isOpen && (
        <BeneficiaryForm
          userId={userId}
          beneficiary={editingBeneficiary}
          onSuccess={handleSuccess}
          onClose={() => {
            setIsOpen(false)
            setEditingBeneficiary(null)
          }}
        />
      )}
    </div>
  )
}