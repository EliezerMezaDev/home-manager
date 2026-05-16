"use client"

import { ClerkProvider } from "@clerk/nextjs"
import { esES } from "@clerk/localizations"

export function ClerkAuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider
      localization={esES}
      signInFallbackRedirectUrl="/d"
      signUpFallbackRedirectUrl="/d"
      signInUrl="/login"
      signUpUrl="/register"
    >
      {children}
    </ClerkProvider>
  )
}
