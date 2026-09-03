import { getCurrentUser } from "@shared/lib/auth-sync"
import {
  getCategories,
  ensureDefaultCategories,
} from "@/modules/categories/actions/categories-actions"
import { CategoriesView } from "@/modules/categories/components/CategoriesView"

export default async function CategoriesPage() {
  const user = await getCurrentUser()

  if (!user) {
    return <div>Error: Usuario no encontrado</div>
  }

  await ensureDefaultCategories(user.id)

  const categories = await getCategories(user.id)

  console.log(categories)

  return <CategoriesView initialData={categories} userId={user.id} />
}
