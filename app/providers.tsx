"use client"

import { SessionProvider } from "next-auth/react"
import { UserProvider } from "@/components/UserContext"

export default function Providers({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SessionProvider>
      <UserProvider>
        {children}
      </UserProvider>
    </SessionProvider>
  )
}
