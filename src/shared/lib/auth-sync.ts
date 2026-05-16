import { prisma } from "./prisma"
import { currentUser } from "@clerk/nextjs/server"

export async function syncUserToDatabase() {
  const clerkUser = await currentUser()
  if (!clerkUser) return null

  let user = await prisma.user.findUnique({
    where: { clerkId: clerkUser.id },
  })

  if (!user) {
    user = await prisma.user.create({
      data: {
        clerkId: clerkUser.id,
        email: clerkUser.primaryEmailAddress?.emailAddress || "",
        name: clerkUser.fullName || clerkUser.firstName,
        profile: {
          create: {
            langPreference: "es",
          },
        },
        settings: {
          create: {
            showReferenceValue: true,
          },
        },
      },
    })
  }

  return user
}

export async function getCurrentUser() {
  const clerkUser = await currentUser()
  if (!clerkUser) return null

  const user = await prisma.user.findUnique({
    where: { clerkId: clerkUser.id },
    include: {
      profile: true,
      settings: true,
      currencies: true,
    },
  })

  return user
}
