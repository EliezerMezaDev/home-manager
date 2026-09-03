export interface Transaction {
  id: string
  userId: string
  accountId: string
  categoryId: string
  beneficiaryId: string | null
  type: "income" | "expense" | "transfer"
  amount: number | string | { toString(): string }
  currencyId: number
  exchangeRate: number | string | { toString(): string }
  referenceAmount: number | string | { toString(): string }
  referenceCurrencyId: number
  description: string | null
  date: Date
  createdAt?: Date
  updatedAt?: Date
  account?: {
    id: string
    name: string
    currencyId: number
    currency?: {
      code: string
      symbol: string
    }
  }
  category?: {
    id: string
    name: string
    type: string
  }
  beneficiary?: {
    id: string
    name: string
  }
  currency?: {
    id: number
    code: string
    symbol: string
  }
}

export interface TransactionFormData {
  type: "income" | "expense" | "transfer"
  accountId: string
  categoryId: string
  beneficiaryId?: string
  amount: number
  currencyId: number
  exchangeRate: number
  referenceAmount: number
  referenceCurrencyId: number
  description?: string
  date?: string
  toAccountId?: string
}

export interface TransactionFilters {
  accountId?: string
  categoryId?: string
  beneficiaryId?: string
  type?: "income" | "expense" | "transfer"
  startDate?: Date
  endDate?: Date
}

export interface TransactionStats {
  totalIncome: number
  totalExpense: number
  balance: number
  byCategory: { categoryId: string; categoryName: string; total: number }[]
  byMonth: { month: string; income: number; expense: number }[]
}