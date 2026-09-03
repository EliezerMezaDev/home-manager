export interface ExchangeRate {
  id: string
  userId: string
  baseCurrencyId: number
  referenceCurrencyId: number
  rate: number | string | { toString(): string }
  isGlobal: boolean
  date: Date
  baseCurrency?: {
    id: number
    code: string
    name: string
    symbol: string
  }
  referenceCurrency?: {
    id: number
    code: string
    name: string
    symbol: string
  }
}

export interface ExchangeRateFormData {
  baseCurrencyId: number
  referenceCurrencyId: number
  rate: number
  isGlobal: boolean
}