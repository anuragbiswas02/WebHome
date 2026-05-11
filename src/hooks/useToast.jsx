import { createContext, useCallback, useContext, useState } from "react";

const ToastContext = createContext(null);

let idSeed = 0;
const nextId = () => ++idSeed;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const show = useCallback(
    (message, opts = {}) => {
      const id = nextId();
      const toast = {
        id,
        message,
        type: opts.type || "info",
        duration: opts.duration ?? 3200,
        action: opts.action || null,
      };
      setToasts((prev) => [...prev, toast]);
      if (toast.duration > 0) {
        setTimeout(() => dismiss(id), toast.duration);
      }
      return id;
    },
    [dismiss],
  );

  const value = {
    toasts,
    dismiss,
    show,
    success: (msg, opts) => show(msg, { ...opts, type: "success" }),
    error: (msg, opts) => show(msg, { ...opts, type: "error" }),
    info: (msg, opts) => show(msg, { ...opts, type: "info" }),
  };

  return (
    <ToastContext.Provider value={value}>{children}</ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
