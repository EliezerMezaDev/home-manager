import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@shadcn/components/ui/card"
import { getCurrentUser } from "@shared/lib/auth-sync"
import { prisma } from "@shared/lib/prisma"
import { format } from "date-fns"
import { es } from "date-fns/locale"

export default async function DashboardPage() {
  const clerkUser = await getCurrentUser()

  if (!clerkUser) {
    return (
      <div className="flex h-full items-center justify-center">
        <p>Cargando...</p>
      </div>
    )
  }

  const [
    accountsCount,
    transactionsCount,
    pantryItemsCount,
    tasksCount,
    recentTransactions,
  ] = await Promise.all([
    prisma.account.count({ where: { userId: clerkUser.id } }),
    prisma.transaction.count({ where: { userId: clerkUser.id } }),
    prisma.pantryItem.count({ where: { userId: clerkUser.id } }),
    prisma.homeTask.count({
      where: {
        userId: clerkUser.id,
        isCompleted: false,
      },
    }),
    prisma.transaction.findMany({
      where: { userId: clerkUser.id },
      orderBy: { date: "desc" },
      take: 5,
      include: {
        account: true,
        category: true,
      },
    }),
  ])

  const stats = [
    {
      title: "Cuentas",
      value: accountsCount,
      description: "Cuentas registradas",
    },
    {
      title: "Transacciones",
      value: transactionsCount,
      description: "Total registrado",
    },
    {
      title: "Despensa",
      value: pantryItemsCount,
      description: "Productos",
    },
    {
      title: "Tareas Pendientes",
      value: tasksCount,
      description: "Por completar",
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Bienvenido, {clerkUser.name || "Usuario"} 👋
        </h1>
        <p className="text-muted-foreground">
          Aquí está el resumen de tu hogar
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Transacciones Recientes</CardTitle>
            <CardDescription>Tus últimas transacciones</CardDescription>
          </CardHeader>
          <CardContent>
            {recentTransactions.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No hay transacciones todavía
              </p>
            ) : (
              <ul className="space-y-3">
                {recentTransactions.map((tx) => (
                  <li
                    key={tx.id}
                    className="flex items-center justify-between text-sm"
                  >
                    <div className="flex flex-col">
                      <span className="font-medium">
                        {tx.category?.name || "Sin categoría"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {tx.account?.name} •{" "}
                        {format(new Date(tx.date), "d MMM", { locale: es })}
                      </span>
                    </div>
                    <span
                      className={
                        tx.type === "income" ? "text-green-600" : "text-red-600"
                      }
                    >
                      {tx.type === "income" ? "+" : "-"}${tx.amount.toString()}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Acciones Rápidas</CardTitle>
            <CardDescription>
              Acceso directo a funciones frecuentes
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            <QuickAction href="/d/transactions" label="Nueva Transacción" />
            <QuickAction href="/d/pantry" label="Ver Despensa" />
            <QuickAction href="/d/shopping" label="Lista de Compras" />
            <QuickAction href="/d/services" label="Mis Servicios" />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function QuickAction({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      className="flex items-center justify-center rounded-lg border bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
    >
      {label}
    </a>
  )
}
