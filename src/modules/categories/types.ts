export interface Category {
  id: string
  userId: string
  name: string
  slug: string | null
  type: "income" | "expense"
  icon: string | null
  parentId: string | null
  createdAt: Date
  updatedAt: Date
  children: Category[]
}

export type CategoryType = "income" | "expense"