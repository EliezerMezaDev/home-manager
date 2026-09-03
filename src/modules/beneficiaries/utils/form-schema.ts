import { z } from "zod"

export const beneficiarySchema = z.object({
  name: z.string().min(1, "El nombre es requerido").max(100),
  type: z.enum(["individual", "company"]).optional(),
  phone: z.string().max(20).optional(),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  notes: z.string().max(500).optional(),
})

export type BeneficiaryFormData = z.infer<typeof beneficiarySchema>

export const defaultBeneficiaryValues: BeneficiaryFormData = {
  name: "",
  type: undefined,
  phone: "",
  email: "",
  notes: "",
}