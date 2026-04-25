"use client"

import { useState } from "react"
import { MessageSquare, X, ChevronUp } from "lucide-react"
import { useCaseStore } from "@/lib/store"
import { cn } from "@/lib/utils"

export function SmsLogPanel() {
  const { smsLog } = useCaseStore()
  const [open, setOpen] = useState(false)

  if (smsLog.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Expanded panel */}
      {open && (
        <div className="mb-2 w-80 max-h-96 rounded-2xl border border-border bg-card shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-bottom-4 fade-in duration-200">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-primary/5">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <MessageSquare className="size-4 text-primary" />
              SMS Log
            </h3>
            <button
              onClick={() => setOpen(false)}
              className="size-7 rounded-full flex items-center justify-center hover:bg-muted transition-colors"
            >
              <X className="size-4 text-muted-foreground" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-border">
            {smsLog.map((entry) => (
              <div key={entry.id} className="px-4 py-3 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono text-muted-foreground">
                    {entry.recipient}
                  </span>
                  <span
                    className={cn(
                      "text-[10px] font-medium px-1.5 py-0.5 rounded-full",
                      entry.status === "sent"
                        ? "bg-success/15 text-success"
                        : entry.status === "simulated"
                          ? "bg-primary/15 text-primary"
                          : "bg-destructive/15 text-destructive"
                    )}
                  >
                    {entry.status === "sent" ? "Sent ✓" : entry.status === "simulated" ? "Simulated" : "Failed"}
                  </span>
                </div>
                <p className="text-xs text-foreground leading-relaxed">
                  {entry.content}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {new Date(entry.timestamp).toLocaleTimeString("en-PH", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Toggle button */}
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "flex items-center gap-2 rounded-full px-4 py-2.5 shadow-lg transition-all",
          "bg-primary text-primary-foreground hover:opacity-90",
          "text-sm font-medium"
        )}
      >
        <MessageSquare className="size-4" />
        SMS Log ({smsLog.length})
        <ChevronUp
          className={cn("size-3.5 transition-transform", open && "rotate-180")}
        />
      </button>
    </div>
  )
}
