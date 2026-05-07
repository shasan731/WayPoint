"use client";

import { X } from "lucide-react";
import { useEffect } from "react";
import { cn } from "@/lib/utils";
import { useUiStore } from "@/store/ui-store";

export function Toaster() {
  const toasts = useUiStore((state) => state.toasts);
  const dismissToast = useUiStore((state) => state.dismissToast);

  useEffect(() => {
    if (toasts.length === 0) {
      return;
    }

    const timer = window.setTimeout(() => {
      dismissToast(toasts[0].id);
    }, 4500);

    return () => window.clearTimeout(timer);
  }, [dismissToast, toasts]);

  return (
    <div className="fixed right-4 top-4 z-[80] flex w-[calc(100vw-2rem)] max-w-sm flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            "rounded-md border bg-white p-4 shadow-panel",
            toast.type === "success" && "border-emerald-200",
            toast.type === "error" && "border-red-200",
            toast.type === "info" && "border-cyan-200"
          )}
        >
          <div className="flex items-start gap-3">
            <div
              className={cn(
                "mt-1 h-2.5 w-2.5 rounded-full",
                toast.type === "success" && "bg-emerald-500",
                toast.type === "error" && "bg-red-500",
                toast.type === "info" && "bg-cyan-500"
              )}
            />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">{toast.title}</p>
              {toast.description ? <p className="mt-1 text-sm text-muted-foreground">{toast.description}</p> : null}
            </div>
            <button
              type="button"
              aria-label="Dismiss notification"
              className="rounded-md p-1 text-muted-foreground hover:bg-muted"
              onClick={() => dismissToast(toast.id)}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
