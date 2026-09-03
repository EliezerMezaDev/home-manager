import { getCurrentUser } from "@shared/lib/auth-sync"
import { getCurrencies } from "@/modules/currencies/actions/currencies-actions"
import { getExchangeRates, getGlobalExchangeRate } from "@/modules/exchange-rates/actions/exchange-rates-actions"
import { ExchangeRatesView } from "@/modules/exchange-rates/components/ExchangeRatesView"

export default async function ExchangeRatesPage() {
  const user = await getCurrentUser()

  if (!user) {
    return <div>Error: Usuario no encontrado</div>
  }

  const [exchangeRates, currencies, globalRate] = await Promise.all([
    getExchangeRates(user.id),
    getCurrencies(user.id),
    getGlobalExchangeRate(user.id),
  ])

  return (
    <ExchangeRatesView
      initialData={exchangeRates as any}
      currencies={currencies as any}
      userId={user.id}
      globalRate={globalRate as any}
    />
  )
}