import { z } from "zod"

export const categorySchema = z.object({
  name: z.string().min(1, "El nombre es requerido").max(100),
  type: z.enum(["income", "expense"], {
    errorMap: () => ({ message: "Selecciona un tipo" }),
  }),
  icon: z.string().max(50).optional(),
  parentId: z.string().uuid("Selecciona una categoría padre válida").nullable().optional(),
})

export const categoryCreateSchema = categorySchema.refine(
  (data) => {
    if (data.parentId) {
      return data.type === "income" || data.type === "expense"
    }
    return true
  },
  {
    message: "La subcategoría debe tener un tipo válido",
    path: ["type"],
  }
)

export type CategoryFormData = z.infer<typeof categorySchema>

export const defaultCategoryValues: CategoryFormData = {
  name: "",
  type: "expense",
  icon: undefined,
  parentId: undefined,
}