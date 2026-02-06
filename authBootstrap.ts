import { onAuthStateChanged } from "firebase/auth"
import { auth, authReady } from "./firebase"

export const initAuth = async (onUser: (user: any) => void) => {
  await authReady
  return onAuthStateChanged(auth, (user) => {
    onUser(user)
  })
}
