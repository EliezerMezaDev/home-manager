import { SignUp } from "@clerk/nextjs"

export default function RegisterPage() {
  return (
    <SignUp
      appearance={{
        elements: {
          rootBox: "w-full max-w-md",
          card: "w-full shadow-lg",
        },
      }}
    />
  )
}
