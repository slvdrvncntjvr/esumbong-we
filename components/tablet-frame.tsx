import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

interface TabletFrameProps {
  children: ReactNode
  className?: string
}

/**
 * Centered tablet-shaped column for admin screens (max 768px).
 */
export function TabletFrame({ children, className }: TabletFrameProps) {
  return (
    <div className="min-h-svh w-full bg-muted/60 flex items-center justify-center md:py-10">
      <div
        className={cn(
          "relative w-full max-w-3xl min-h-svh md:min-h-[900px] md:rounded-[1.75rem] bg-background overflow-hidden",
          "md:shadow-[0_24px_60px_-24px_rgb(30_58_138_/_0.18),0_0_0_1px_rgb(15_23_42_/_0.04)]",
          "md:border md:border-border/60",
          className,
        )}
      >
        <div className="flex flex-col min-h-svh md:min-h-[900px]">{children}</div>
      </div>
    </div>
  )
}
