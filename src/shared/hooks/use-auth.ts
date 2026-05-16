import { useUser } from "@clerk/nextjs"

export function useAuth() {
  const { user, isLoaded, isSignedIn } = useUser()

  return {
    user,
    isLoaded,
    isSignedIn,
    userId: user?.id,
    email: user?.primaryEmailAddress?.emailAddress,
    fullName: user?.fullName || user?.firstName,
    imageUrl: user?.imageUrl,
  }
}
