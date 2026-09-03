export interface Beneficiary {
  id: string
  userId: string
  name: string
  slug: string | null
  type: "individual" | "company" | null
  phone: string | null
  email: string | null
  notes: string | null
  createdAt?: Date
  updatedAt?: Date
}

export interface BeneficiaryFormData {
  name: string
  type?: "individual" | "company"
  phone?: string
  email?: string
  notes?: string
}