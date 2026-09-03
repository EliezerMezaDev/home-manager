import { z } from "zod"

export const exchangeRateSchema = z.object({
  baseCurrencyId: z.number().int().positive("Selecciona la moneda base"),
  referenceCurrencyId: z.number().int().positive("Selecciona la moneda de referencia"),
  rate: z.number().positive("La tasa debe ser positiva").min(0.01),
  isGlobal: z.boolean().optional().default(false),
}).refine((data) => {
  return data.baseCurrencyId !== data.referenceCurrencyId
}, {
  message: "Las monedas deben ser diferentes",
  path: ["referenceCurrencyId"]
})

export type ExchangeRateFormData = z.infer<typeof exchangeRateSchema>

export const defaultExchangeRateValues: ExchangeRateFormData = {
  baseCurrencyId: 0,
  referenceCurrencyId: 0,
  rate: 0,
  isGlobal: false,
}