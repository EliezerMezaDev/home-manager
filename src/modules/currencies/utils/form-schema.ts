import { z } from "zod"

export const currencySchema = z.object({
  code: z.string().min(2, "El código debe tener al menos 2 caracteres").max(10),
  name: z.string().min(1, "El nombre es requerido").max(100),
  symbol: z.string().min(1, "El símbolo es requerido").max(5),
  isCrypto: z.boolean().optional().default(false),
})

export type CurrencyFormData = z.infer<typeof currencySchema>

export const defaultCurrencyValues: CurrencyFormData = {
  code: "",
  name: "",
  symbol: "",
  isCrypto: false,
}
