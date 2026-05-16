# Documento de Requerimientos de Producto (PRD)

## HomeManager v1.0

**Estado:** Borrador Unificado

**Stack:** Next.js 16 (App Router), React 19, Tailwind CSS v4, shadcn/ui, Prisma ORM, Neon PostgreSQL, Zustand, Clerk, Zod, React Hook Form.

**Fecha de Creación:** Mayo 2026

---

## 1. Visión del Producto

HomeManager es una plataforma web centralizada e intuitiva diseñada para resolver las complejidades logísticas, operativas y financieras de la gestión diaria de un hogar en Venezuela. El sistema utiliza Next.js como framework fullstack, conectándose directamente a una base de datos PostgreSQL en Neon mediante Prisma ORM.

La solución integra un motor financiero multimoneda robusto que permite la coexistencia de Bolívares (VES) y Dólares (USD), adaptado a las particularidades del entorno económico venezolano. La arquitectura frontend-with-prisma garantiza una experiencia rápida donde Next.js maneja tanto la UI como el acceso directo a la base de datos.

---

## 2. Objetivos Estratégicos

- **Centralización:** Eliminar el uso de múltiples libretas, notas sueltas o chats de WhatsApp para la organización del hogar.
- **Eficacia Financiera:** Permitir un control estricto del presupuesto familiar en un entorno bimonetario con tasas de cambio fluctuantes.
- **Reducción de Desperdicio:** Monitorear la despensa en tiempo real para evitar compras duplicadas o el vencimiento de alimentos.
- **Puntualidad en Servicios:** Evitar suspensiones de servicios básicos mediante un sistema de control de fechas de corte y pagos.
- **Persistencia en la Nube:** Todos los datos se almacenan en Neon PostgreSQL y se sincronizan en tiempo real.

---

## 3. Perfiles de Usuario

### 3.1 Administrador Principal del Hogar

Se encarga de realizar las compras, registrar los pagos de servicios y controlar el inventario de la despensa. Necesita rapidez y una interfaz accesible desde dispositivos móviles mientras está en el supermercado. Tiene acceso completo a todas las funcionalidades del sistema.

### 3.2 Co-administrador / Familiar

Miembro del hogar que puede visualizar las tareas pendientes, añadir elementos a la lista de compras y consultar si un producto está disponible en la despensa. Acceso de solo lectura a datos financieros sensibles.

---

## 4. Contexto de Mercado (Venezuela)

1. **Economía Bimonetaria (USD / VES):** Todos los módulos de gastos y compras soportan transacciones tanto en Bolívares como en Dólares, permitiendo registrar la tasa de cambio de referencia.

2. **Identificadores de Servicios Públicos:** El registro de servicios incluye campos específicos como el NIC (Corpoelec), Número de Contrato (CANTV/Internet Fibra), Cuentas de Contrato de Hidrológicas.

3. **Optimización de Conectividad:** La aplicación es ligera, priorizando estrategias de renderizado eficiente (Server Components de Next.js) y manejo óptimo de estados para funcionar correctamente con conexiones intermitentes.

---

## 5. Stack Tecnológico

| Categoría | Tecnología | Versión |
|-----------|------------|---------|
| Framework | Next.js | 16.x (App Router) |
| UI Library | React | 19.x |
| Styling | Tailwind CSS | v4 (pattern `@theme inline`) |
| Component Library | shadcn/ui | Latest |
| Database | PostgreSQL (Neon) | Latest |
| ORM | Prisma | 7.x |
| Autenticación | Clerk | Latest |
| State Management | Zustand | Latest |
| Form Management | React Hook Form | Latest |
| Form Validation | Zod | Latest |
| Language | TypeScript | Strict mode |
| Date Handling | date-fns | Latest |
| Toast Notifications | sonner | Latest |

---

## 6. Arquitectura de Conexión a Base de Datos

### 6.1 Prisma en Next.js

El proyecto utiliza Prisma directamente desde Next.js para conectarse a Neon PostgreSQL:

```
┌─────────────────────────────────────────────────────────────┐
│                        Next.js App                          │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────────────┐   │
│  │  Frontend   │  │ API Routes  │  │  Server Actions  │   │
│  │   (React)   │  │ (Route.ts)  │  │   (async ops)    │   │
│  └─────────────┘  └─────────────┘  └──────────────────┘   │
│                           │                                 │
│                    ┌──────┴──────┐                         │
│                    │ PrismaClient│                         │
│                    └──────┬──────┘                         │
└───────────────────────────┼─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Neon PostgreSQL                          │
│              (Base de datos en la nube)                    │
└─────────────────────────────────────────────────────────────┘
```

### 6.2 Configuración de Prisma

```typescript
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// El resto del esquema...
```

```typescript
// lib/prisma.ts
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

### 6.3 Uso en Server Components

```typescript
// app/d/transactions/page.tsx
import { prisma } from '@/lib/prisma'
import { TransactionsView } from '@/modules/transactions/components/TransactionsView'

export default async function TransactionsPage() {
  const transactions = await prisma.transaction.findMany({
    where: { userId: currentUser.id },
    include: { account: true, category: true },
    orderBy: { date: 'desc' }
  })

  return <TransactionsView initialData={transactions} />
}
```

### 6.4 Uso en Server Actions

```typescript
// modules/transactions/actions.ts
'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function createTransaction(data: TransactionFormData) {
  const transaction = await prisma.transaction.create({
    data: {
      // ... data
    }
  })

  revalidatePath('/d/transactions')
  return transaction
}
```

---

## 7. Requisitos Funcionales

### 7.1 Módulo de Autenticación (Clerk)

**RF7.1.1 - Registro de Usuario:** El usuario debe poder registrarse usando email y contraseña a través de Clerk.

**RF7.1.2 - Inicio de Sesión:** Login con email/password, Google OAuth o GitHub (configurado en Clerk).

**RF7.1.3 - Gestión de Sesión:** Sesiones persistentes con Clerk, logout desde cualquier página.

**RF7.1.4 - Protección de Rutas:** Middleware de Clerk para proteger todas las rutas del dashboard (`/d/*`).

**RF7.1.5 - Datos de Usuario:** Sincronización de datos de Clerk (email, name, userId) con el perfil del usuario en la base de datos.

### 7.2 Módulo de Inventario de Despensa

**RF7.2.1 - Registro de Productos:** El usuario debe poder registrar productos con campos de: Nombre, Categoría (Alimentos, Limpieza, Higiene, Proteínas, Farmacia, Otros), Cantidad Actual, Unidad de Medida (Kg, Gr, Litros, ml, Unidades, Paquetes).

**RF7.2.2 - Stock Mínimo (Alerta de Escasez):** Definición de un umbral mínimo para cada producto. Si la cantidad actual es igual o inferior al umbral, el producto se marcará automáticamente en estado "Por Agotarse" (amarillo) o "Agotado" (rojo).

**RF7.2.3 - Control de Vencimiento:** Registro opcional de fechas de caducidad con alertas visuales:
- Verde: Más de 7 días hasta vencimiento
- Amarillo: Entre 3 y 7 días
- Rojo: Menos de 3 días o vencido

**RF7.2.4 - Categorías de Productos:** Sistema de categorías personalizables para organizar el inventario.

**RF7.2.5 - Búsqueda y Filtrado:** Búsqueda por nombre, filtro por categoría, filtro por estado de stock.

**RF7.2.6 - Edición y Eliminación:** Modificación de cualquier campo del producto, eliminación lógica (soft delete).

### 7.3 Módulo de Generación de Lista de Compra

**RF7.3.1 - Auto-generación por Stock Mínimo:** El sistema compila automáticamente una lista de compras basada en todos los productos de la despensa que se encuentren por debajo de su stock mínimo.

**RF7.3.2 - Lista Manual:** Permitir añadir ítems de forma rápida que no necesariamente formen parte del inventario fijo (ej. "Antojo", "Repuesto específico").

**RF7.3.3 - Modo Supermercado (Checklist):** Una vista optimizada para móviles donde el usuario va tachando los productos a medida que los introduce en el carrito.

**RF7.3.4 - Cantidades en Lista:** El usuario puede especificar la cantidad deseada en la lista, independientemente de la cantidad actual en inventario.

**RF7.3.5 - Sincronización Automática:** Al marcar una compra como "Completada", el sistema ofrece actualizar automáticamente las cantidades en el inventario de la despensa.

**RF7.3.6 - Exportación:** Exportar lista a WhatsApp (texto plano), PDF o copiar al portapapeles.

### 7.4 Módulo Financiero (Gestión de Gastos e Ingresos)

**RF7.4.1 - Soporte Multimoneda Real:** Cada transacción (ingreso o egreso) permite seleccionar la moneda (USD o VES). El sistema cuenta con un campo para fixer la tasa de cambio del día.

**RF7.4.2 - Tasa de Cambio:**
- Campo global de tasa de cambio (se usa por defecto en todas las transacciones)
- Posibilidad de especificar tasa manual por transacción
- Historial de tasas de cambio utilizadas

**RF7.4.3 - Categorización de Gastos:** Clasificación de egresos en categorías:
- Alimentación
- Servicios Públicos
- Salud/Medicinas
- Transporte/Gasolina
- Mantenimiento del Hogar
- Entretenimiento
- Educación
- Otros

**RF7.4.4 - Ingresos:** Registro de ingresos con categorías:
- Salario
- Bono/Regalo
- Venta
- Otro

**RF7.4.5 - Cuentas:**
- Registro de cuentas (Efectivo, Banco, Zelle, Pago Móvil)
- Moneda de la cuenta (USD o VES)
- Saldo inicial y saldo actual (calculado automáticamente)

**RF7.4.6 - Transacciones:**
- Fecha de la transacción
- Cuenta origen/destino
- Categoría
- Beneficiario (opcional)
- Monto en moneda de operación
- Monto en referencia (convertido)
- Descripción
- Tipo (ingreso/egreso/transferencia)

**RF7.4.7 - Resumen Financiero Dinámico:**
- Balance total (USD y VES)
- Gráfico de distribución de gastos por categoría
- Evolución mensual de ingresos/egresos
- Tendencia de gastos últimos 30 días

### 7.5 Módulo de Tasas de Cambio

**RF7.5.1 - Registro de Tasa:** El usuario puede registrar la tasa de cambio del día manualmente.

**RF7.5.2 - Tasas Predefinidas:** Opcionalmente, integrable con API externa (ej. rate limitada de exchange rate) o entrada manual.

**RF7.5.3 - Historial de Tasas:** Registro de tasas utilizadas en transacciones anteriores con fecha.

**RF7.5.4 - Tasas por Defecto:**设定 una tasa global que se usa en nuevas transacciones.

### 7.6 Módulo de Servicios Públicos y Recurrentes

**RF7.6.1 - Fichas de Servicios Técnicos:** Registro estructurado de los servicios del hogar:

| Servicio | Campos Específicos |
|----------|-------------------|
| Electricidad (Corpoelec) | NIC, Cuenta Contrato |
| Agua (Hidrológica) | Número de cuenta, Padrón |
| Internet/Telefonía | Proveedor, Número de teléfono, ID de usuario |
| Gas | Tipo (Comunal/Directo), Cilindros/Gancho |
| Aseo Urbano | Cuenta contrato |
| Condominio | Monto fijo, fecha de corte |

**RF7.6.2 - Control de Estatus de Pago:** Estados configurables:
- **Al Día:** Servicio pagado y al corriente
- **Pendiente:** Por pagar en los próximos días
- **Vencido:** Fecha de pago superada sin cancelar

**RF7.6.3 - Frecuencia de Pago:** Configurable por servicio:
- Mensual
- Bimestral
- Trimestral
- Anual
- Variable

**RF7.6.4 - Historial de Facturación:** Registro de:
- Monto pagado
- Fecha de pago
- Referencia (número de transferencia, referencia de pago móvil)
- Notas adjuntas

**RF7.6.5 - Recordatorios Visuales:** Alertas según la proximidad a la fecha de vencimiento.

**RF7.6.6 - Costo Mensual Estimado:** Campo para registrar el costo promedio mensual de cada servicio.

### 7.7 Módulo de Beneficiarios

**RF7.7.1 - Registro de Beneficiarios:** Nombre, tipo (Individual/Empresa), teléfono, email, notas.

**RF7.7.2 - Historial de Transacciones:** Ver todas las transacciones realizadas a un beneficiario específico.

### 7.8 Módulo de Categorías

**RF7.8.1 - Categorías Personalizables:** El usuario puede crear, editar y eliminar categorías de transacciones.

**RF7.8.2 - Categorías por Defecto:** El sistema incluye categorías predefinidas para ingresos y gastos.

**RF7.8.3 - Iconos de Categoría:** Each categoría puede tener un icono asociado.

### 7.9 Módulo de Tareas del Hogar

**RF7.9.1 - To-Do List del Hogar:** Registro de:
- Título
- Descripción
- Fecha de vencimiento (opcional)
- Prioridad (Baja, Media, Alta)
- Estado (Pendiente/Completada)

**RF7.9.2 - Filtrado:** Ver tareas pendientes, completadas, o todas.

**RF7.9.3 - Vencimiento:** Las tareas vencidas se marcan visualmente.

### 7.10 Módulo de Configuración y Perfil

**RF7.10.1 - Perfil de Usuario:** Datos sincronizados desde Clerk (email, nombre).

**RF7.10.2 - Configuración de Moneda:** Moneda base y moneda de referencia del usuario.

**RF7.10.3 - Preferencias de Interfaz:** Tema (claro/oscuro/sistema), idioma.

---

## 8. Modelo de Datos (Prisma Schema)

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id            String    @id @default(uuid()) @db.Uuid
  clerkId       String    @unique // ID de Clerk
  email         String    @unique
  name          String?
  householdId   String?   @db.Uuid
  household     Household? @relation(fields: [householdId], references: [id])
  profile       UserProfile?
  settings      UserSettings?
  currencies    Currency[]
  accounts      Account[]
  categories    Category[]
  beneficiaries Beneficiary[]
  exchangeRates ExchangeRate[]
  transactions  Transaction[]
  pantryItems   PantryItem[]
  shoppingList  ShoppingItem[]
  services      HomeService[]
  tasks         HomeTask[]
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  @@map("users")
}

model Household {
  id          String    @id @default(uuid()) @db.Uuid
  name        String
  members     User[]
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@map("households")
}

model UserProfile {
  userId             String  @id @db.Uuid
  name               String?
  lastName           String?
  baseCurrencyId     Int?
  referenceCurrencyId Int?
  langPreference     String  @default("es")
  user               User    @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("user_profiles")
}

model UserSettings {
  userId              String @id @db.Uuid
  showReferenceValue  Boolean @default(true)
  user                User    @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("user_settings")
}

model Currency {
  id          Int      @id @default(autoincrement())
  userId      String   @db.Uuid
  code        String   // USD, VES, etc.
  name        String
  symbol      String
  isCrypto    Boolean  @default(false)
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  accounts    Account[]
  transactions Transaction[]
  baseExchangeRates  ExchangeRate[] @relation("ExchangeRateBaseCurrency")
  referenceExchangeRates ExchangeRate[] @relation("ExchangeRateReferenceCurrency")

  @@unique([userId, code])
  @@map("currencies")
}

model Account {
  id              String   @id @default(uuid()) @db.Uuid
  userId          String   @db.Uuid
  name            String
  currencyId      Int
  institution     String?
  type            String   // cash, bank, digital
  initialBalance  Decimal  @default(0) @db.Decimal(18, 8)
  currentBalance  Decimal  @default(0) @db.Decimal(18, 8)
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  currency        Currency @relation(fields: [currencyId], references: [id])
  transactions    Transaction[]

  @@unique([userId, name])
  @@map("accounts")
}

model Category {
  id        String    @id @default(uuid()) @db.Uuid
  userId    String    @db.Uuid
  name      String
  slug      String?
  type      String    // income, expense
  icon      String?
  parentId  String?   @db.Uuid
  parent    Category? @relation("CategoryToCategory", fields: [parentId], references: [id])
  children  Category[] @relation("CategoryToCategory")
  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  transactions Transaction[]

  @@unique([userId, name])
  @@unique([userId, slug])
  @@map("categories")
}

model Beneficiary {
  id      String   @id @default(uuid()) @db.Uuid
  userId  String   @db.Uuid
  name    String
  slug    String?
  type    String?  // individual, company
  phone   String?
  email   String?
  notes   String?
  user    User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  transactions Transaction[]

  @@unique([userId, name])
  @@unique([userId, slug])
  @@map("beneficiaries")
}

model ExchangeRate {
  id                  String   @id @default(uuid()) @db.Uuid
  userId              String   @db.Uuid
  baseCurrencyId      Int
  referenceCurrencyId Int
  rate                Decimal  @db.Decimal(18, 8)
  isGlobal            Boolean  @default(false)
  date                DateTime @default(now())
  user                User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  baseCurrency        Currency @relation("ExchangeRateBaseCurrency", fields: [baseCurrencyId], references: [id])
  referenceCurrency   Currency @relation("ExchangeRateReferenceCurrency", fields: [referenceCurrencyId], references: [id])

  @@unique([userId, baseCurrencyId, referenceCurrencyId])
  @@map("exchange_rates")
}

model Transaction {
  id                    String   @id @default(uuid()) @db.Uuid
  userId                String   @db.Uuid
  accountId             String   @db.Uuid
  categoryId            String   @db.Uuid
  beneficiaryId         String?  @db.Uuid
  type                  String   // income, expense, transfer
  amount                Decimal  @db.Decimal(18, 8)
  currencyId            Int
  exchangeRate          Decimal  @db.Decimal(18, 8)
  referenceAmount       Decimal  @db.Decimal(18, 8)
  referenceCurrencyId   Int
  description           String?
  date                  DateTime @default(now())
  user                  User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  account               Account  @relation(fields: [accountId], references: [id], onDelete: Cascade)
  category              Category @relation(fields: [categoryId], references: [id])
  beneficiary           Beneficiary? @relation(fields: [beneficiaryId], references: [id])

  @@map("transactions")
}

model PantryItem {
  id             String    @id @default(uuid()) @db.Uuid
  userId         String    @db.Uuid
  name           String
  category       String    // Alimentos, Limpieza, etc.
  currentQty     Decimal   @default(0) @db.Decimal(18, 4)
  minQty         Decimal   @default(1) @db.Decimal(18, 4)
  unit           String    // Kg, L, Und, etc.
  expirationDate DateTime?
  notes          String?
  user           User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt

  @@map("pantry_items")
}

model ShoppingItem {
  id            String    @id @default(uuid()) @db.Uuid
  userId        String    @db.Uuid
  pantryItemId  String?   @db.Uuid
  name          String
  quantity      Decimal   @default(1) @db.Decimal(18, 4)
  isChecked     Boolean   @default(false)
  priority      String    @default("medium") // low, medium, high
  user          User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt     DateTime  @default(now())
  completedAt   DateTime?

  @@map("shopping_items")
}

model HomeService {
  id            String   @id @default(uuid()) @db.Uuid
  userId        String   @db.Uuid
  name          String   // Corpoelec, CANTV, etc.
  type          String   // electricity, water, internet, gas, other
  contractId    String?  // NIC, número de cuenta, etc.
  monthlyCost   Decimal? @db.Decimal(18, 2)
  currency      String   @default("USD")
  frequency     String   @default("monthly") // monthly, bimonthly, quarterly, annual
  dueDay        Int      // Día del mes de vencimiento
  status        String   @default("active") // active, inactive
  notes         String?
  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  payments      ServicePayment[]
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@map("home_services")
}

model ServicePayment {
  id          String     @id @default(uuid()) @db.Uuid
  serviceId   String     @db.Uuid
  amount      Decimal    @db.Decimal(18, 2)
  currency    String
  paymentDate DateTime   @default(now())
  reference   String?
  notes       String?
  service     HomeService @relation(fields: [serviceId], references: [id], onDelete: Cascade)

  @@map("service_payments")
}

model HomeTask {
  id          String    @id @default(uuid()) @db.Uuid
  userId      String    @db.Uuid
  title       String
  description String?
  dueDate     DateTime?
  priority    String    @default("medium") // low, medium, high
  isCompleted Boolean   @default(false)
  completedAt DateTime?
  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@map("home_tasks")
}
```

---

## 9. Estructura de Carpetas del Proyecto

```
src/
├── prisma/
│   └── schema.prisma                # Esquema de Prisma
├── app/
│   ├── (marketing)/
│   │   ├── page.tsx                  # Landing page
│   │   └── layout.tsx
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx              # Clerk SignIn
│   │   ├── register/
│   │   │   └── page.tsx              # Clerk SignUp
│   │   └── layout.tsx
│   ├── d/                            # Dashboard protegido
│   │   ├── layout.tsx                # Layout con sidebar
│   │   ├── page.tsx                  # Dashboard overview
│   │   ├── pantry/
│   │   ├── transactions/
│   │   ├── accounts/
│   │   ├── categories/
│   │   ├── beneficiaries/
│   │   ├── exchange-rates/
│   │   ├── services/
│   │   ├── tasks/
│   │   ├── settings/
│   │   └── profile/
│   ├── api/
│   │   └── auth/[...clerk]/route.ts  # Clerk API routes
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── ui/                            # Componentes shadcn/ui
│   ├── layout/
│   ├── table/
│   └── forms/
├── lib/
│   ├── prisma.ts                      # Cliente Prisma
│   ├── constants.ts
│   ├── utils.ts
│   ├── currency.ts
│   ├── date.ts
│   └── filter-parser.ts
├── hooks/
├── modules/
│   ├── auth/
│   ├── pantry/
│   ├── shopping/
│   ├── transactions/
│   ├── accounts/
│   ├── categories/
│   ├── beneficiaries/
│   ├── exchange-rates/
│   ├── services/
│   ├── tasks/
│   └── settings/
└── public/
```

---

## 10. Estructura de Módulo (Patrón expense-manager fe)

Cada módulo sigue una estructura consistente basada en el proyecto expense-manager fe:

### 10.1 Estructura General de un Módulo

```
src/modules/<module>/
├── actions/
│   └── <module>-actions.ts            # Server Actions (Prisma)
├── components/
│   ├── <Module>View.tsx              # Vista principal
│   ├── <Module>Filter.tsx            # Filtros
│   ├── <Module>Table.tsx             # Tabla de datos
│   ├── <Module>Form.tsx              # Formulario CRUD
│   ├── <Module>DetailView.tsx        # Vista detalle
│   ├── <Module>EditView.tsx          # Vista edición
│   └── ui/
│       └── columns.tsx                # Columnas
├── stores/
│   └── use<Module>Store.ts           # Zustand store (estado UI)
├── hooks/
│   └── use<Module>.ts                # Hook de acceso
├── utils/
│   └── form-schema.ts                # Zod schema + tipos
└── types.ts                          # Tipos TypeScript
```

### 10.2 Ejemplo: Server Actions con Prisma

```typescript
// src/modules/transactions/actions.ts
'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { transactionSchema } from './utils/form-schema'
import type { TransactionFormData } from './utils/form-schema'

export async function createTransaction(data: TransactionFormData) {
  const validated = transactionSchema.parse(data)

  const transaction = await prisma.transaction.create({
    data: {
      userId: validated.userId,
      accountId: validated.accountId,
      categoryId: validated.categoryId,
      beneficiaryId: validated.beneficiaryId,
      type: validated.type,
      amount: validated.amount,
      currencyId: validated.currencyId,
      exchangeRate: validated.exchangeRate,
      referenceAmount: validated.referenceAmount,
      referenceCurrencyId: validated.referenceCurrencyId,
      description: validated.description,
      date: new Date(validated.date)
    }
  })

  // Actualizar saldo de cuenta
  await prisma.account.update({
    where: { id: validated.accountId },
    data: {
      currentBalance: {
        increment: validated.type === 'income' ? validated.amount : -validated.amount
      }
    }
  })

  revalidatePath('/d/transactions')
  return transaction
}

export async function getTransactions(userId: string, filters?: {
  accountId?: string
  categoryId?: string
  startDate?: Date
  endDate?: Date
}) {
  return prisma.transaction.findMany({
    where: {
      userId,
      ...(filters?.accountId && { accountId: filters.accountId }),
      ...(filters?.categoryId && { categoryId: filters.categoryId }),
      ...(filters?.startDate && filters?.endDate && {
        date: {
          gte: filters.startDate,
          lte: filters.endDate
        }
      })
    },
    include: {
      account: true,
      category: true,
      beneficiary: true
    },
    orderBy: { date: 'desc' }
  })
}
```

### 10.3 Ejemplo de Store (Zustand)

```typescript
// src/modules/transactions/stores/useTransactionsStore.ts
import { create } from 'zustand'

interface TransactionsState {
  items: Transaction[]
  isLoading: boolean
  error: string | null

  fetchAll: () => Promise<void>
  create: (data: TransactionFormData) => Promise<void>
  update: (id: string, data: Partial<TransactionFormData>) => Promise<void>
  remove: (id: string) => Promise<void>
}

export const useTransactionsStore = create<TransactionsState>((set) => ({
  items: [],
  isLoading: false,
  error: null,

  fetchAll: async () => {
    set({ isLoading: true })
    try {
      const { getTransactions } = await import('@modules/transactions/actions')
      const transactions = await getTransactions(currentUserId)
      set({ items: transactions, isLoading: false })
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false })
    }
  },

  create: async (data) => {
    set({ isLoading: true })
    try {
      const { createTransaction } = await import('@modules/transactions/actions')
      await createTransaction(data)
      await get().fetchAll()
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false })
    }
  },

  // ... update y remove
}))
```

### 10.4 Ejemplo de Zod Schema

```typescript
// src/modules/transactions/utils/form-schema.ts
import { z } from 'zod'

export const transactionSchema = z.object({
  userId: z.string().uuid(),
  accountId: z.string().uuid('Selecciona una cuenta'),
  categoryId: z.string().uuid('Selecciona una categoría'),
  beneficiaryId: z.string().uuid().optional(),
  type: z.enum(['income', 'expense', 'transfer']),
  amount: z.number()
    .positive('El monto debe ser positivo')
    .max(999999999, 'Monto demasiado grande'),
  currencyId: z.number().int().positive('Selecciona una moneda'),
  exchangeRate: z.number().positive('La tasa debe ser positiva'),
  referenceAmount: z.number(),
  referenceCurrencyId: z.number().int().positive(),
  description: z.string().max(500).optional(),
  date: z.string().datetime().optional()
}).refine((data) => {
  return data.currencyId !== data.referenceCurrencyId
}, {
  message: 'La moneda de operación y la moneda de referencia deben ser diferentes',
  path: ['referenceCurrencyId']
})

export type TransactionFormData = z.infer<typeof transactionSchema>

export const defaultTransactionValues: Partial<TransactionFormData> = {
  type: 'expense',
  amount: 0,
  exchangeRate: 1,
  referenceAmount: 0,
  date: new Date().toISOString()
}
```

---

## 11. Sistema de Filtrado, Ordenamiento y Paginación

Same as expense-manager fe pattern:
- Filter parser en `@lib/filter-parser`
- TableFiltersInput component
- TablePagination component
- Prisma query parameters para filtrado

### 11.1 Filtrado con Prisma

```typescript
// En las Server Actions
export async function getTransactions(userId: string, options: {
  filters?: ParsedFilter
  sort?: SortOptions
  page?: number
  limit?: number
}) {
  const { filters, sort, page = 1, limit = 10 } = options

  // Construir where clause desde filters
  const where: Prisma.TransactionWhereInput = {
    userId,
    ...buildFilters(filters)
  }

  const [items, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      include: { account: true, category: true },
      orderBy: sort ? { [sort.sortBy]: sort.sortOrder } : { date: 'desc' },
      skip: (page - 1) * limit,
      take: limit
    }),
    prisma.transaction.count({ where })
  ])

  return {
    items,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
  }
}
```

---

## 12. Autenticación con Clerk

### 12.1 Configuración

```typescript
// src/middleware.ts
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isProtectedRoute = createRouteMatcher(['/d(.*)'])

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect()
  }
})

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)']
}
```

### 12.2 Hook de Usuario

```typescript
// src/hooks/use-auth.ts
import { useUser } from '@clerk/nextjs'

export function useAuth() {
  const { user, isLoaded, isSignedIn } = useUser()

  return {
    user,
    isLoaded,
    isSignedIn,
    userId: user?.id,
    email: user?.primaryEmailAddress?.emailAddress,
    fullName: user?.fullName
  }
}
```

### 12.3 Sincronización con Prisma

```typescript
// src/lib/auth-sync.ts
import { prisma } from './prisma'
import { currentUser } from '@clerk/nextjs/server'

export async function syncUserToDatabase() {
  const clerkUser = await currentUser()
  if (!clerkUser) return null

  // Buscar o crear usuario en nuestra base de datos
  let user = await prisma.user.findUnique({
    where: { clerkId: clerkUser.id }
  })

  if (!user) {
    user = await prisma.user.create({
      data: {
        clerkId: clerkUser.id,
        email: clerkUser.primaryEmailAddress?.emailAddress || '',
        name: clerkUser.fullName || clerkUser.firstName,
        profile: {
          create: {
            langPreference: 'es'
          }
        },
        settings: {
          create: {
            showReferenceValue: true
          }
        }
      }
    })
  }

  return user
}
```

---

## 13. Requisitos No Funcionales

**RNF 13.1 - Rendimiento y Arquitectura:** La aplicación utiliza Next.js (App Router) aprovechando Server Components para reducir el bundle de JavaScript en el cliente, logrando tiempos de carga inicial (FCP) menores a 1.5 segundos en redes móviles 3G/4G estables.

**RNF 13.2 - Responsividad (Mobile-First):** La interfaz construida con Tailwind CSS v4 y componentes de shadcn/ui está 100% optimizada para pantallas móviles, garantizando zonas de toque amplias para su uso en movimiento.

**RNF 13.3 - Consistencia de Datos:** Prisma junto con Neon PostgreSQL garantiza transacciones ACID seguras, especialmente crítico al descontar inventario y generar registros contables simultáneamente.

**RNF 13.4 - Seguridad y Autenticación:** Clerk maneja la autenticación de forma segura. Los datos en PostgreSQL están asociados al ID de Clerk del usuario.

**RNF 13.5 - Conexión a la Nube:** La aplicación requiere conexión a internet para funcionar, sincronizando datos en tiempo real con Neon.

---

## 14. Fases de Desarrollo

| Fase | Enfoque | Módulos |
|------|---------|----------|
| **Fase 1** | Foundation | Auth (Clerk), Prisma setup, Layout, Dashboard, Configuración de monedas |
| **Fase 2** | Finanzas | Cuentas, Transacciones, Categorías, Beneficiarios, Tasas de cambio, Resumen financiero |
| **Fase 3** | Inventario y Servicios | Despensa (Pantry), Lista de compras, Servicios públicos, Pagos de servicios |
| **Fase 4** | Tareas y Configuración | Tareas del hogar, Perfil, Settings, Theme |
| **Fase 5** | Polish | Tests, Optimización, Documentación |

---

## 15. Criterios de Aceptación para MVP

El éxito del lanzamiento de la primera versión de HomeManager se medirá bajo el cumplimiento de los siguientes hitos:

1. Un usuario puede iniciar sesión con Clerk y ver su dashboard.

2. Un usuario puede registrar un producto en la despensa, restarle stock y ver cómo se refleja automáticamente en la lista de compras si cae por debajo del mínimo.

3. Un usuario puede registrar un gasto en Bolívares introduciendo la tasa de cambio, y el sistema guarda el equivalente exacto en Dólares de forma interna para estadísticas consistentes.

4. La interfaz se adapta sin desbordamientos de diseño en un teléfono inteligente estándar (ej. resolución de 360x800px).

5. Los estados de las facturas de servicios públicos cambian visualmente cuando la fecha actual sobrepasa la fecha de vencimiento configurada.

6. Los datos persisten en Neon PostgreSQL y se cargan correctamente.

---

## 16. Variables de Entorno

```env
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/login
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/register
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/d
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/d

# Database (Neon PostgreSQL)
DATABASE_URL="postgresql://user:password@host.neon.tech/dbname?sslmode=require"

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 17. Scripts Disponibles

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Iniciar servidor de desarrollo con Turbopack |
| `npm run build` | Compilación de producción |
| `npm run lint` | Verificación de ESLint |
| `npm run typecheck` | Verificación de TypeScript (noEmit) |
| `npm run format` | Formateo con Prettier |
| `npx prisma studio` | Abrir Prisma Studio para gestión de datos |
| `npx prisma db push` | Sincronizar esquema con la base de datos |
| `npx prisma generate` | Generar Prisma Client |

---

## 18. AGENTS.md - Configuración del Proyecto

### Project Overview
- Next.js 16 (App Router) with React 19
- Tailwind CSS v4 with `@theme inline` pattern (no tailwind.config.ts)
- shadcn/ui with local MCP tool enabled
- TypeScript with strict mode
- Prisma ORM with Neon PostgreSQL
- Clerk for authentication
- Zustand for state management
- React Hook Form + Zod for forms

### Commands
- `npm run dev` - Start dev server with Turbopack
- `npm run build` - Production build
- `npm run lint` - ESLint check
- `npm run typecheck` - TypeScript check (noEmit)
- `npm run format` - Prettier write (requires `--write` flag)
- `npx prisma studio` - Open Prisma database GUI
- `npx prisma db push` - Sync schema to database
- `npx prisma generate` - Generate Prisma Client

### Key Conventions
- Path alias: `@/*` maps to project root
- Module alias: `@m-<module>/*` maps to `src/modules/<module>/*`
- shadcn components: `npx shadcn@latest add <component>`
- UI components in `components/ui/`, utils in `lib/utils.ts`
- Dark mode via `next-themes` - use ThemeProvider wrapper
- Prisma client in `lib/prisma.ts`

### Tailwind v4 Notes
- Uses `@import "tailwindcss"` syntax (not `@tailwind` directives)
- Custom theme vars defined in `app/globals.css` via `@theme inline`
- CSS variables use `oklch()` color space

### Prisma Pattern
- Schema in `prisma/schema.prisma`
- Client usage in Server Components and Server Actions
- Prisma client singleton in `lib/prisma.ts`
- Use `revalidatePath()` after mutations

### Module Architecture (Pattern)

```
src/modules/<module>/
├── actions/
│   └── <module>-actions.ts       # Server Actions (Prisma)
├── components/
│   ├── <Module>View.tsx         # Listado principal
│   ├── <Module>Filter.tsx        # Filtros
│   ├── <Module>Table.tsx         # Tabla de datos
│   ├── <Module>Form.tsx          # Formulario CRUD
│   ├── <Module>DetailView.tsx    # Vista detalle
│   ├── <Module>EditView.tsx      # Vista edición
│   └── ui/
│       └── columns.tsx          # Columnas
├── stores/
│   └── use<Module>Store.ts       # Zustand store
├── hooks/
│   └── use<Module>.ts            # Hook de acceso
├── utils/
│   └── form-schema.ts           # Zod schema + tipos
└── types.ts                     # Tipos TypeScript
```

### Store Pattern (Zustand + Prisma)
```typescript
interface <Module>State {
  items: <Module>Type[]
  isLoading: boolean
  error: string | null
  
  fetchAll: () => Promise<void>
  create: (data: Input) => Promise<void>
  update: (id: string, data: Input) => Promise<void>
  remove: (id: string) => Promise<void>
}

export const use<Module>Store = create<<Module>State>((set, get) => ({
  items: [],
  isLoading: false,
  error: null,
  
  fetchAll: async () => {
    set({ isLoading: true })
    try {
      const { get<Module>s } = await import('@m-<module>/actions')
      const result = await get<Module>s(userId)
      set({ items: result.items, isLoading: false })
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false })
    }
  },
  
  // ... resto de métodos que llaman a Server Actions
}))
```

### View Pattern
- Usa `"use client"` para estado local
- Fetch inicial de datos via props (Server Component)
- Actualizaciones via Server Actions y revalidatePath
- Loading states inline (Skeleton)
- Error handling con toast (sonner)

### Form Pattern
- Server Actions para mutations
- React Hook Form + Zod resolver
- Componentes shadcn (Field, Input, Select, etc.)
- onSubmit llama a Server Action, luego revalidatePath

### Pages (App Router)
```
src/app/d/<module>/
├── page.tsx              # Listado (Server Component + Client View)
├── create/page.tsx      # Crear
├── [id]/
│   ├── page.tsx         # Detalle
│   └── edit/page.tsx    # Editar
```

### Import Aliases
- `@m-<module>/actions/*` - Server actions del modulo
- `@m-<module>/components/*` - componentes del modulo
- `@m-<module>/hooks/*` - hooks del modulo
- `@m-<module>/stores/*` - stores del modulo
- `@m-<module>/utils/*` - utilidades del modulo
- `@components/*` - componentes globales
- `@lib/*` - librerías y utilitarias (incluye prisma.ts)
- `@hooks/*` - hooks globales

### Not Configured
- No test framework (Jest/Vitest not installed)
- No pre-commit hooks
- No CI/CD workflows

### Database (Prisma + Neon)

Schema models:
- User (con clerkId para integración con Clerk)
- Household
- UserProfile
- UserSettings
- Currency
- Account
- Category
- Beneficiary
- ExchangeRate
- Transaction
- PantryItem
- ShoppingItem
- HomeService
- ServicePayment
- HomeTask

### Filter, Sort & Pagination System

Same as expense-manager fe pattern:
- Filter parser en `@lib/filter-parser`
- TableFiltersInput component
- TablePagination component
- Server Actions con Prisma query params para filtrado, sort y paginación
- Hook con métodos de control