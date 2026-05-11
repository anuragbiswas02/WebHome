import { createContext, useCallback, useContext, useRef, useState } from "react";
import { AlertTriangle } from "lucide-react";

const ConfirmContext = createContext(null);

export function ConfirmProvider({ children }) {
  const [state, setState] = useState(null);
  const resolver = useRef(null);

  const confirm = useCallback((opts) => {
    return new Promise((resolve) => {
      resolver.current = resolve;
      setState({
        title: opts.title || "Are you sure?",
        description: opts.description || "",
        confirmLabel: opts.confirmLabel || "Confirm",
        cancelLabel: opts.cancelLabel || "Cancel",
        destructive: !!opts.destructive,
      });
    });
  }, []);

  const handle = (result) => {
    if (resolver.current) resolver.current(result);
    resolver.current = null;
    setState(null);
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {state && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end lg:items-center justify-center p-0 lg:p-4 z-[300] anim-backdrop"
          onClick={() => handle(false)}
        >
          <div
            className="w-full lg:max-w-sm bg-bg-card rounded-t-3xl lg:rounded-2xl shadow-float border border-white/10 anim-sheet-up lg:anim-pop"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 lg:p-6">
              <div className="flex items-start gap-4">
                <div
                  className={`shrink-0 w-11 h-11 rounded-full flex items-center justify-center ${state.destructive
                    ? "bg-red-500/15 text-red-500"
                    : "bg-primary-orange/15 text-primary-orange"
                    }`}
                >
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-bold text-text-primary leading-tight">
                    {state.title}
                  </h2>
                  {state.description && (
                    <p className="mt-1.5 text-sm text-text-secondary leading-relaxed">
                      {state.description}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex gap-2.5 mt-6">
                <button
                  type="button"
                  onClick={() => handle(false)}
                  className="flex-1 py-2.5 rounded-xl bg-bg-input text-text-primary font-semibold hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
                >
                  {state.cancelLabel}
                </button>
                <button
                  type="button"
                  autoFocus
                  onClick={() => handle(true)}
                  className={`flex-1 py-2.5 rounded-xl text-white font-semibold shadow-lg transition-all ${state.destructive
                    ? "bg-red-500 hover:bg-red-600 shadow-red-500/30"
                    : "bg-primary-orange hover:shadow-xl shadow-orange"
                    }`}
                >
                  {state.confirmLabel}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error("useConfirm must be used within ConfirmProvider");
  return ctx;
}
