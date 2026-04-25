"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, FileText, User, PlusCircle } from "lucide-react"

import { cn } from "@/lib/utils"

const items = [
  { href: "/dashboard", label: "Tahanan", icon: Home },
  { href: "/file", label: "Mag-ulat", icon: PlusCircle },
  { href: "/cases", label: "Mga Kaso", icon: FileText },
  { href: "/profile", label: "Profile", icon: User },
]

export function BottomNav() {
  const pathname = usePathname()
  return (
    <nav className="sticky bottom-0 inset-x-0 border-t border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <ul className="grid grid-cols-4">
        {items.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href))
          return (
            <li key={href}>
              <Link
                href={href}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 py-3 text-xs font-medium transition-colors",
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="size-5" strokeWidth={active ? 2.25 : 1.75} />
                <span>{label}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
