import { getCurrentUser } from "@shared/lib/auth-sync"
import { getBeneficiaries } from "@/modules/beneficiaries/actions/beneficiaries-actions"
import { BeneficiariesView } from "@/modules/beneficiaries/components/BeneficiariesView"

export default async function BeneficiariesPage() {
  const user = await getCurrentUser()

  if (!user) {
    return <div>Error: Usuario no encontrado</div>
  }

  const beneficiaries = await getBeneficiaries(user.id)

  return (
    <BeneficiariesView
      initialData={beneficiaries as any}
      userId={user.id}
    />
  )
}