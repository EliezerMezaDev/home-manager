"use client"

import { useState } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@shadcn/components/ui/card"
import { Button } from "@shadcn/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@shadcn/components/ui/tabs"
import { Plus, Pencil, Trash2, ChevronRight, ChevronDown } from "lucide-react"
import { CategoryForm } from "./CategoryForm"
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
import type { Category } from "../types"
import { deleteCategory } from "../actions/categories-actions"

interface CategoriesViewProps {
  initialData: Category[]
  userId: string
}

export function CategoriesView({ initialData, userId }: CategoriesViewProps) {
  const [categories, setCategories] = useState<Category[]>(initialData)
  const [isOpen, setIsOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const handleSuccess = (category: Category) => {
    if (editingCategory) {
      setCategories((prev) =>
        updateCategoryInTree(prev, category.id, category)
      )
      toastSuccess("Categoría actualizada")
    } else {
      const newCategory: Category = {
        ...category,
        children: [],
      }
      setCategories((prev) => [...prev, newCategory])
      toastSuccess("Categoría creada")
    }
    setIsOpen(false)
    setEditingCategory(null)
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteCategory(id)
      setCategories((prev) => removeCategoryFromTree(prev, id))
      toastSuccess("Categoría eliminada")
    } catch (error) {
      toastError(error instanceof Error ? error.message : "Error al eliminar")
    }
  }

  const incomeCategories = categories.filter((c) => c.type === "income")
  const expenseCategories = categories.filter((c) => c.type === "expense")

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Categorías</h1>
          <p className="text-muted-foreground">
            Administra las categorías de tus transacciones
          </p>
        </div>
        <Button onClick={() => setIsOpen(true)}>
          <Plus className="mr-2 h-6 w-6" />
          Nueva Categoría
        </Button>
      </div>

      <Tabs defaultValue="expense" className="space-y-4">
        <TabsList>
          <TabsTrigger value="income">Ingresos ({incomeCategories.length})</TabsTrigger>
          <TabsTrigger value="expense">Gastos ({expenseCategories.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="income" className="space-y-4">
          <CategoryList
            categories={incomeCategories}
            expandedIds={expandedIds}
            onToggleExpand={toggleExpand}
            onEdit={(cat) => {
              setEditingCategory(cat)
              setIsOpen(true)
            }}
            onDelete={handleDelete}
          />
        </TabsContent>

        <TabsContent value="expense" className="space-y-4">
          <CategoryList
            categories={expenseCategories}
            expandedIds={expandedIds}
            onToggleExpand={toggleExpand}
            onEdit={(cat) => {
              setEditingCategory(cat)
              setIsOpen(true)
            }}
            onDelete={handleDelete}
          />
        </TabsContent>
      </Tabs>

      {isOpen && (
        <CategoryForm
          userId={userId}
          category={editingCategory}
          categories={categories}
          onSuccess={handleSuccess}
          onClose={() => {
            setIsOpen(false)
            setEditingCategory(null)
          }}
        />
      )}
    </div>
  )
}

interface CategoryListProps {
  categories: Category[]
  expandedIds: Set<string>
  onToggleExpand: (id: string) => void
  onEdit: (category: Category) => void
  onDelete: (id: string) => void
}

function CategoryList({
  categories,
  expandedIds,
  onToggleExpand,
  onEdit,
  onDelete,
}: CategoryListProps) {
  if (categories.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-10">
          <p className="text-muted-foreground">No hay categorías</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-2">
      {categories.map((category) => (
        <CategoryItem
          key={category.id}
          category={category}
          expandedIds={expandedIds}
          onToggleExpand={onToggleExpand}
          onEdit={onEdit}
          onDelete={onDelete}
          depth={0}
        />
      ))}
    </div>
  )
}

interface CategoryItemProps {
  category: Category
  expandedIds: Set<string>
  onToggleExpand: (id: string) => void
  onEdit: (category: Category) => void
  onDelete: (id: string) => void
  depth: number
}

function CategoryItem({
  category,
  expandedIds,
  onToggleExpand,
  onEdit,
  onDelete,
  depth,
}: CategoryItemProps) {
  const hasChildren = category.children && category.children.length > 0
  const isExpanded = expandedIds.has(category.id)

  return (
    <div>
      <Card className={`${depth > 0 ? "ml-4 border-l-4 border-l-primary" : ""}`}>
        <CardContent className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            {hasChildren ? (
              <button
                onClick={() => onToggleExpand(category.id)}
                className="flex h-6 w-6 items-center justify-center rounded hover:bg-muted"
              >
                {isExpanded ? (
                  <ChevronDown className="h-6 w-6" />
                ) : (
                  <ChevronRight className="h-6 w-6" />
                )}
              </button>
            ) : (
              <div className="w-6" />
            )}
            <div>
              <CardTitle className="text-base font-medium">
                {category.name}
              </CardTitle>
              {category.parentId && (
                <CardDescription className="text-xs">
                  Subcategoría
                </CardDescription>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(category)}
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
                  <AlertDialogTitle>¿Eliminar categoría?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta acción no se puede deshacer.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => onDelete(category.id)}
                  >
                    Eliminar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>
      {hasChildren && isExpanded && (
        <div className="space-y-2 py-2">
          {category.children.map((child: Category) => (
            <CategoryItem
              key={child.id}
              category={child}
              expandedIds={expandedIds}
              onToggleExpand={onToggleExpand}
              onEdit={onEdit}
              onDelete={onDelete}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function updateCategoryInTree(
  categories: Category[],
  id: string,
  updated: Category
): Category[] {
  return categories.map((cat) => {
    if (cat.id === id) {
      return { ...cat, ...updated, children: cat.children }
    }
    if (cat.children && cat.children.length > 0) {
      return {
        ...cat,
        children: updateCategoryInTree(cat.children, id, updated),
      }
    }
    return cat
  })
}

function removeCategoryFromTree(
  categories: Category[],
  id: string
): Category[] {
  return categories
    .filter((cat) => cat.id !== id)
    .map((cat) => ({
      ...cat,
      children: cat.children ? removeCategoryFromTree(cat.children, id) : [],
    }))
}