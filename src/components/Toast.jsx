import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { useToast } from '../hooks/useToast';

const ICONS = {
    success: CheckCircle2,
    error: AlertCircle,
    info: Info,
};

const STYLES = {
    success: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-500',
    error: 'border-red-500/30 bg-red-500/10 text-red-500',
    info: 'border-primary-orange/30 bg-primary-orange/10 text-primary-orange',
};

export function ToastContainer() {
    const { toasts, dismiss } = useToast();

    if (toasts.length === 0) return null;

    return (
        <div className="fixed bottom-4 lg:bottom-6 left-1/2 -translate-x-1/2 lg:left-auto lg:right-6 lg:translate-x-0 z-[200] flex flex-col gap-2 w-[calc(100%-2rem)] max-w-sm pointer-events-none">
            {toasts.map((toast) => {
                const Icon = ICONS[toast.type] || Info;
                return (
                    <div
                        key={toast.id}
                        className="pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-2xl bg-bg-card/95 backdrop-blur-xl border border-white/10 shadow-float anim-slide-up"
                    >
                        <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center border ${STYLES[toast.type] || STYLES.info}`}>
                            <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0 pt-1">
                            <p className="text-sm font-medium text-text-primary leading-snug break-words">
                                {toast.message}
                            </p>
                            {toast.action && (
                                <button
                                    onClick={() => {
                                        toast.action.onClick();
                                        dismiss(toast.id);
                                    }}
                                    className="mt-1.5 text-xs font-semibold text-primary-orange hover:underline"
                                >
                                    {toast.action.label}
                                </button>
                            )}
                        </div>
                        <button
                            onClick={() => dismiss(toast.id)}
                            className="shrink-0 p-1 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-input transition-colors"
                            aria-label="Dismiss"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                );
            })}
        </div>
    );
}
