"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";

type ToastType = "success" | "error" | "info" | "warning";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = "info") => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-8 right-8 z-[100] flex flex-col gap-3 pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, scale: 0.8, x: 20 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.8, x: 20 }}
              className={`
                pointer-events-auto px-6 py-4 rounded-2xl shadow-2xl backdrop-blur-xl border border-white/20
                flex items-center gap-4 min-w-[300px] max-w-[450px]
                ${toast.type === "success" ? "bg-[#894d0d] text-white" : 
                  toast.type === "error" ? "bg-red-900 text-white" : 
                  "bg-[#31302e] text-white"}
              `}
              style={{
                fontFamily: "'Manrope', sans-serif",
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)"
              }}
            >
              <span className="material-symbols-outlined text-[20px]">
                {toast.type === "success" ? "check_circle" : 
                 toast.type === "error" ? "error" : 
                 "info"}
              </span>
              <p className="text-xs font-black uppercase tracking-widest">{toast.message}</p>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within a ToastProvider");
  return context;
}
