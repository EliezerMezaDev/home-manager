import { z } from "zod"

export const accountSchema = z.object({
  name: z.string().min(1, "El nombre es requerido").max(100),
  currencyId: z.number().int().positive("Selecciona una moneda"),
  institution: z.string().max(100).optional(),
  type: z.enum(["cash", "bank", "digital"], {
    errorMap: () => ({ message: "Selecciona un tipo de cuenta" }),
  }),
  initialBalance: z.number().default(0),
})

export type AccountFormData = z.infer<typeof accountSchema>

export const defaultAccountValues: AccountFormData = {
  name: "",
  currencyId: 0,
  institution: "",
  type: "cash",
  initialBalance: 0,
}