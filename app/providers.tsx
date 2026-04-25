"use client"

import { CaseStoreProvider } from "@/lib/store"
import { AuthProvider } from "@/lib/auth"
import { SmsLogPanel } from "@/components/sms-log"
import { Toaster } from "sonner"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <CaseStoreProvider>
        {children}
        <SmsLogPanel />
        <Toaster
          position="top-center"
          richColors
          toastOptions={{
            className: "font-sans",
          }}
        />
      </CaseStoreProvider>
    </AuthProvider>
  )
}
