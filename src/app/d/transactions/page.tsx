import { getCurrentUser } from "@shared/lib/auth-sync"
import { getAccounts } from "@/modules/accounts/actions/accounts-actions"
import { getCategories } from "@/modules/categories/actions/categories-actions"
import { getBeneficiaries } from "@/modules/beneficiaries/actions/beneficiaries-actions"
import { getCurrencies } from "@/modules/currencies/actions/currencies-actions"
import { getExchangeRates, getGlobalExchangeRate } from "@/modules/exchange-rates/actions/exchange-rates-actions"
import { getTransactions } from "@/modules/transactions/actions/transactions-actions"
import { TransactionsView } from "@/modules/transactions/components/TransactionsView"

export default async function TransactionsPage() {
  const user = await getCurrentUser()

  if (!user) {
    return <div>Error: Usuario no encontrado</div>
  }

  const [transactions, accounts, categories, beneficiaries, currencies, globalRate] = await Promise.all([
    getTransactions(user.id),
    getAccounts(user.id),
    getCategories(user.id),
    getBeneficiaries(user.id),
    getCurrencies(user.id),
    getGlobalExchangeRate(user.id),
  ])

  const globalRateData = globalRate ? {
    rate: Number(globalRate.rate),
    baseCurrencyId: globalRate.baseCurrencyId,
    referenceCurrencyId: globalRate.referenceCurrencyId,
  } : null

  return (
    <TransactionsView
      initialData={transactions as any}
      accounts={accounts as any}
      categories={categories as any}
      beneficiaries={beneficiaries as any}
      currencies={currencies as any}
      globalRate={globalRateData}
      userId={user.id}
    />
  )
}