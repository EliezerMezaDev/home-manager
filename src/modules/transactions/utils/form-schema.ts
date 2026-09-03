import { z } from "zod"

export const transactionSchema = z.object({
  type: z.enum(["income", "expense", "transfer"], {
    errorMap: () => ({ message: "Selecciona un tipo" }),
  }),
  accountId: z.string().min(1, "Selecciona una cuenta"),
  categoryId: z.string().min(1, "Selecciona una categoría"),
  beneficiaryId: z.string().optional(),
  amount: z.number().positive("El monto debe ser positivo"),
  currencyId: z.number().int().positive("Selecciona una moneda"),
  exchangeRate: z.number().positive("La tasa debe ser positiva"),
  referenceAmount: z.number(),
  referenceCurrencyId: z.number().int().positive(),
  description: z.string().max(500).optional(),
  date: z.string().optional(),
  toAccountId: z.string().optional(),
}).refine((data) => {
  if (data.type === "transfer" && !data.toAccountId) {
    return false
  }
  return true
}, {
  message: "Selecciona una cuenta destino para la transferencia",
  path: ["toAccountId"]
}).refine((data) => {
  return data.currencyId !== data.referenceCurrencyId
}, {
  message: "Las monedas deben ser diferentes",
  path: ["referenceCurrencyId"]
})

export type TransactionFormData = z.infer<typeof transactionSchema>

export const defaultTransactionValues: TransactionFormData = {
  type: "expense",
  accountId: "",
  categoryId: "",
  beneficiaryId: undefined,
  amount: 0,
  currencyId: 0,
  exchangeRate: 1,
  referenceAmount: 0,
  referenceCurrencyId: 0,
  description: "",
  date: new Date().toISOString(),
  toAccountId: undefined,
}