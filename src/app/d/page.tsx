import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@shadcn/components/ui/card"
import { getCurrentUser } from "@shared/lib/auth-sync"
import { prisma } from "@shared/lib/prisma"
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns"
import { es } from "date-fns/locale"
import { FinancialCharts } from "@shared/components/charts/FinancialCharts"

export default async function DashboardPage() {
  const clerkUser = await getCurrentUser()

  if (!clerkUser) {
    return (
      <div className="flex h-full items-center justify-center">
        <p>Cargando...</p>
      </div>
    )
  }

  const now = new Date()
  const startOfCurrentMonth = startOfMonth(now)
  const endOfCurrentMonth = endOfMonth(now)
  const sixMonthsAgo = subMonths(now, 6)
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  const [
    accountsData,
    accountsCount,
    transactionsCount,
    pantryItemsCount,
    tasksCount,
    recentTransactions,
    currentMonthExpenses,
    monthlyTransactions,
  ] = await Promise.all([
    prisma.account.findMany({
      where: { userId: clerkUser.id },
      include: { currency: true },
    }),
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
    prisma.transaction.findMany({
      where: {
        userId: clerkUser.id,
        type: "expense",
        date: {
          gte: startOfCurrentMonth,
          lte: endOfCurrentMonth,
        },
      },
      include: { category: true },
    }),
    prisma.transaction.findMany({
      where: {
        userId: clerkUser.id,
        date: { gte: sixMonthsAgo },
      },
      orderBy: { date: "asc" },
    }),
  ])

  const accountsByCurrency = accountsData.map((account) => ({
    currencyCode: account.currency?.code || "USD",
    balance: Number(account.currentBalance),
  }))

  const totalUSD = accountsByCurrency
    .filter((a) => a.currencyCode === "USD")
    .reduce((sum, a) => sum + a.balance, 0)

  const totalVES = accountsByCurrency
    .filter((a) => a.currencyCode === "VES")
    .reduce((sum, a) => sum + a.balance, 0)

  const expensesByCategory = currentMonthExpenses.reduce((acc, tx) => {
    const catName = tx.category?.name || "Sin categoría"
    if (!acc[catName]) {
      acc[catName] = 0
    }
    acc[catName] += Number(tx.referenceAmount)
    return acc
  }, {} as Record<string, number>)

  const expensesChartData = Object.entries(expensesByCategory).map(
    ([name, total]) => ({
      categoryName: name,
      total,
    })
  )

  const monthlyMap: Record<string, { income: number; expense: number }> = {}

  for (let i = 0; i < 6; i++) {
    const month = subMonths(now, i)
    const monthKey = format(month, "MMM", { locale: es })
    monthlyMap[monthKey] = { income: 0, expense: 0 }
  }

  monthlyTransactions.forEach((tx) => {
    const monthKey = format(new Date(tx.date), "MMM", { locale: es })
    if (monthlyMap[monthKey]) {
      if (tx.type === "income") {
        monthlyMap[monthKey].income += Number(tx.referenceAmount)
      } else if (tx.type === "expense") {
        monthlyMap[monthKey].expense += Number(tx.referenceAmount)
      }
    }
  })

  const monthlyChartData = Object.entries(monthlyMap)
    .map(([month, data]) => ({
      month,
      income: data.income,
      expense: data.expense,
    }))
    .reverse()

  const recentBalanceTxs = await prisma.transaction.findMany({
    where: {
      userId: clerkUser.id,
      date: { gte: thirtyDaysAgo },
    },
    orderBy: { date: "asc" },
  })

  let runningBalance = totalUSD
  const trendData: { date: string; balance: number }[] = []

  recentBalanceTxs.forEach((tx) => {
    if (tx.type === "income") {
      runningBalance += Number(tx.referenceAmount)
    } else if (tx.type === "expense") {
      runningBalance -= Number(tx.referenceAmount)
    }
    trendData.push({
      date: format(new Date(tx.date), "d MMM", { locale: es }),
      balance: runningBalance,
    })
  })

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

      <FinancialCharts
        expensesByCategory={expensesChartData}
        monthlyData={monthlyChartData}
        trendData={trendData}
        totalUSD={totalUSD}
        totalVES={totalVES}
      />

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
            <QuickAction href="/d/accounts" label="Ver Cuentas" />
            <QuickAction href="/d/categories" label="Categorías" />
            <QuickAction href="/d/exchange-rates" label="Tasas" />
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