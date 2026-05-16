import { SignIn } from "@clerk/nextjs"

export default function LoginPage() {
  return (
    <SignIn
    
      appearance={
        
        {
        
        elements: {
          rootBox: "w-full max-w-md",
          card: "w-full shadow-lg",
        },
      }}
    />
  )
}
