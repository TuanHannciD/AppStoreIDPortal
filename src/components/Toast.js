"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  useEffect,
} from "react";
import { cn } from "@/lib/utils";

const ToastContext = createContext(null);

function makeId() {
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef(new Map());

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const t = timers.current.get(id);
    if (t) {
      clearTimeout(t);
      timers.current.delete(id);
    }
  }, []);

  const pushToast = useCallback(
    ({ title, message, intent = "info", ttlMs = 3500 }) => {
      const id = makeId();
      const toast = { id, title, message, intent };
      setToasts((prev) => [toast, ...prev].slice(0, 4));
      const timer = setTimeout(() => removeToast(id), ttlMs);
      timers.current.set(id, timer);
      return id;
    },
    [removeToast],
  );

  useEffect(() => {
    window.showToast = (title, message, isInfo) => {
      pushToast({
        title: title || "Notice",
        message,
        intent: isInfo ? "info" : "success",
      });
    };

    return () => {
      delete window.showToast;
    };
  }, [pushToast]);

  const value = useMemo(
    () => ({ toasts, pushToast, removeToast }),
    [toasts, pushToast, removeToast],
  );

  return (
    <ToastContext.Provider value={value}>{children}</ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

const INTENT_CLASS = {
  info: "border-slate-200 bg-white text-slate-900",
  success: "border-emerald-200 bg-emerald-50 text-emerald-900",
  warning: "border-amber-200 bg-amber-50 text-amber-900",
  danger: "border-rose-200 bg-rose-50 text-rose-900",
};

export function ToastViewport() {
  const ctx = useContext(ToastContext);
  if (!ctx) return null;

  return (
    <div
      className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-[92vw] max-w-sm flex-col gap-2"
      aria-live="polite"
      aria-relevant="additions"
    >
      {ctx.toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            "pointer-events-auto rounded-2xl border p-4 shadow-card",
            INTENT_CLASS[t.intent] || INTENT_CLASS.info,
          )}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-sm font-semibold">{t.title || "Notice"}</div>
              {t.message ? (
                <div className="mt-1 text-sm opacity-80">{t.message}</div>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => ctx.removeToast(t.id)}
              className="rounded-lg border border-transparent bg-transparent px-2 py-1 text-xs font-semibold opacity-70 hover:border-slate-200 hover:opacity-100"
              aria-label="Dismiss"
            >
              ✕
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
