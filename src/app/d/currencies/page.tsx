import { getCurrentUser } from "@shared/lib/auth-sync"
import {
  getCurrencies,
  ensureDefaultCurrencies,
} from "@/modules/currencies/actions/currencies-actions"
import { CurrenciesView } from "@/modules/currencies/components/CurrenciesView"

export default async function CurrenciesPage() {
  const user = await getCurrentUser()

  if (!user) {
    return <div>Error: Usuario no encontrado</div>
  }

  await ensureDefaultCurrencies(user.id)

  const currencies = await getCurrencies(user.id)

  return <CurrenciesView initialData={currencies} userId={user.id} />
}
