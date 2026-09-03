import { Geist, Geist_Mono, Noto_Sans } from "next/font/google"

import "@styles/globals.css"
import { ThemeProvider } from "@shared/components/theme-provider"
import { ClerkAuthProvider } from "@shared/components/clerk-provider"
import { cn } from "@shared/lib/utils"
import { Toaster as SonnerToaster, toast } from "sonner"

const notoSans = Noto_Sans({ subsets: ["latin"], variable: "--font-sans" })

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "antialiased",
        fontMono.variable,
        "font-sans",
        notoSans.variable
      )}
    >
      <body>
        <ClerkAuthProvider>
          <ThemeProvider>{children}</ThemeProvider>
        </ClerkAuthProvider>
        <SonnerToaster position="bottom-right" richColors />
      </body>
    </html>
  )
}
