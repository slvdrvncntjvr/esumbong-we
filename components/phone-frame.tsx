import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

interface PhoneFrameProps {
  children: ReactNode
  className?: string
}

/**
 * Centered phone-shaped column on desktop, full-bleed on mobile.
 * No simulated status bar — keeps the app feeling like a clean web/PWA.
 */
export function PhoneFrame({ children, className }: PhoneFrameProps) {
  return (
    <div className="min-h-svh w-full bg-muted/60 flex items-center justify-center md:py-10">
      <div
        className={cn(
          "relative w-full max-w-[430px] min-h-svh md:min-h-[860px] md:rounded-[2rem] bg-background overflow-hidden",
          "md:shadow-[0_24px_60px_-24px_rgb(30_58_138_/_0.18),0_0_0_1px_rgb(15_23_42_/_0.04)]",
          "md:border md:border-border/60",
          className,
        )}
      >
        <div className="flex flex-col min-h-svh md:min-h-[860px]">{children}</div>
      </div>
    </div>
  )
}
