export interface Account {
  id: string
  userId: string
  name: string
  currencyId: number
  institution: string | null
  type: string
  initialBalance: number | string | { toString(): string }
  currentBalance: number | string | { toString(): string }
  createdAt?: Date
  updatedAt?: Date
  currency?: {
    id: number
    code: string
    name: string
    symbol: string
  }
}

export type AccountType = "cash" | "bank" | "digital"

export interface AccountFormData {
  name: string
  currencyId: number
  institution?: string
  type: AccountType
  initialBalance: number
}