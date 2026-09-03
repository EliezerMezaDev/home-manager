import { getCurrentUser } from "@shared/lib/auth-sync"
import { getCurrencies } from "@/modules/currencies/actions/currencies-actions"
import { getAccounts } from "@/modules/accounts/actions/accounts-actions"
import { AccountsView } from "@/modules/accounts/components/AccountsView"

export default async function AccountsPage() {
  const user = await getCurrentUser()

  if (!user) {
    return <div>Error: Usuario no encontrado</div>
  }

  const [accounts, currencies] = await Promise.all([
    getAccounts(user.id),
    getCurrencies(user.id),
  ])

  return (
    <AccountsView
      initialData={accounts as any}
      currencies={currencies as any}
      userId={user.id}
    />
  )
}