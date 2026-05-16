import { useContext } from "react"
import { AuthContext } from "../provider"

export function useCurrentUser() {
  const context = useContext(AuthContext)
  
  if (context === undefined) {
    throw new Error("useCurrentUser must be used within an AuthProvider")
  }
  
  return context
}

