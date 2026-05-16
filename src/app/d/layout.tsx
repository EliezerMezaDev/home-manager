import { Sidebar } from "@shared/layout/sidebar"
import { Header } from "@shared/layout/header"
import { syncUserToDatabase } from "@shared/lib/auth-sync"
import { redirect } from "next/navigation"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await syncUserToDatabase()

  if (!user) {
    redirect("/login")
  }

  return (
    <div className="flex h-svh overflow-hidden">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto bg-muted/30 p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
