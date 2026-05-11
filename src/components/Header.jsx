import {
    Moon,
    Sun,
    Image as ImageIcon,
    Eye,
    EyeOff,
    Menu,
    X,
    Settings,
    Search,
    Focus,
    Maximize,
    Minimize,
    CheckSquare,
} from 'lucide-react';
import { useEffect, useState } from 'react';

export function Header({
    theme,
    toggleTheme,
    onRefreshWallpaper,
    toggleWallpaperVisibility,
    isWallpaperVisible,
    onOpenSettings,
    onOpenPalette,
    onToggleFocus,
    focusMode,
    onToggleSelect,
    syncBadge = null,
}) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isFs, setIsFs] = useState(false);

    useEffect(() => {
        const sync = () => setIsFs(Boolean(document.fullscreenElement));
        document.addEventListener('fullscreenchange', sync);
        sync();
        return () => document.removeEventListener('fullscreenchange', sync);
    }, []);

    const toggleBrowserFullscreen = async () => {
        try {
            if (!document.fullscreenElement) {
                await document.documentElement.requestFullscreen?.();
            } else {
                await document.exitFullscreen?.();
            }
        } catch (err) {
            console.warn('Fullscreen failed:', err);
        }
    };

    const close = () => setIsMenuOpen(false);

    return (
        <header className="px-4 pt-[max(env(safe-area-inset-top),1rem)] pb-3">
            <div className="flex items-center justify-between gap-2 max-w-7xl mx-auto">
                <div className="flex items-center gap-2">{syncBadge}</div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={onOpenPalette}
                        className="w-11 h-11 rounded-xl bg-bg-card flex items-center justify-center shadow-sm hover:shadow-md transition-all active:scale-95 border border-white/10"
                        title="Search (⌘K)"
                        aria-label="Open command palette"
                    >
                        <Search className="w-5 h-5 text-text-primary" />
                    </button>

                    <button
                        onClick={() => setIsMenuOpen(true)}
                        className="w-11 h-11 rounded-xl bg-bg-card flex items-center justify-center shadow-sm hover:shadow-md transition-all active:scale-95 border border-white/10"
                        aria-label="Open menu"
                    >
                        <Menu className="w-5 h-5 text-text-primary" />
                    </button>
                </div>
            </div>

            <MenuPopup
                open={isMenuOpen}
                onClose={close}
                items={[
                    {
                        key: 'palette',
                        icon: Search,
                        label: 'Command palette',
                        hint: '⌘K',
                        onClick: () => {
                            onOpenPalette?.();
                            close();
                        },
                    },
                    {
                        key: 'focus',
                        icon: Focus,
                        label: focusMode ? 'Exit focus mode' : 'Focus mode',
                        hint: 'F',
                        active: focusMode,
                        onClick: () => {
                            onToggleFocus?.();
                            close();
                        },
                    },
                    {
                        key: 'fullscreen',
                        icon: isFs ? Minimize : Maximize,
                        label: isFs ? 'Exit fullscreen' : 'Enter fullscreen',
                        onClick: () => {
                            toggleBrowserFullscreen();
                            close();
                        },
                    },
                    onToggleSelect && {
                        key: 'select',
                        icon: CheckSquare,
                        label: 'Select / group bookmarks',
                        onClick: () => {
                            onToggleSelect?.();
                            close();
                        },
                    },
                    {
                        key: 'wallpaper-vis',
                        icon: isWallpaperVisible ? Eye : EyeOff,
                        label: isWallpaperVisible ? 'Hide wallpaper' : 'Show wallpaper',
                        active: isWallpaperVisible,
                        onClick: () => {
                            toggleWallpaperVisibility?.();
                            close();
                        },
                    },
                    isWallpaperVisible && {
                        key: 'wallpaper-shuffle',
                        icon: ImageIcon,
                        label: 'Shuffle wallpaper',
                        hint: 'W',
                        onClick: () => {
                            onRefreshWallpaper?.();
                            close();
                        },
                    },
                    {
                        key: 'theme',
                        icon: theme === 'light' ? Moon : Sun,
                        label: theme === 'light' ? 'Dark mode' : 'Light mode',
                        hint: 'T',
                        onClick: () => {
                            toggleTheme?.();
                            close();
                        },
                    },
                    {
                        key: 'settings',
                        icon: Settings,
                        label: 'Settings',
                        onClick: () => {
                            onOpenSettings?.();
                            close();
                        },
                    },
                ].filter(Boolean)}
            />
        </header>
    );
}

function MenuPopup({ open, onClose, items }) {
    useEffect(() => {
        if (!open) return;
        const onKey = (e) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', onKey);
        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            window.removeEventListener('keydown', onKey);
            document.body.style.overflow = prevOverflow;
        };
    }, [open, onClose]);

    if (!open) return null;

    return (
        <div
            className="fixed inset-0 z-[130] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm anim-backdrop"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
        >
            <div
                onClick={(e) => e.stopPropagation()}
                className="w-full sm:max-w-sm bg-bg-card rounded-t-3xl sm:rounded-2xl shadow-float border border-white/10 anim-sheet-up sm:anim-pop overflow-hidden pb-[env(safe-area-inset-bottom)]"
            >
                <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
                    <h2 className="text-base font-bold text-text-primary">Menu</h2>
                    <button
                        onClick={onClose}
                        className="w-9 h-9 rounded-full bg-bg-input flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                        aria-label="Close menu"
                    >
                        <X className="w-5 h-5 text-text-secondary" />
                    </button>
                </div>

                <div className="p-2 max-h-[70vh] overflow-y-auto no-scrollbar">
                    {items.map((item) => {
                        const Icon = item.icon;
                        return (
                            <button
                                key={item.key}
                                onClick={item.onClick}
                                className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-colors ${item.active
                                    ? 'bg-primary-orange/15 text-primary-orange'
                                    : 'hover:bg-bg-input text-text-primary'
                                    }`}
                            >
                                <div
                                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${item.active
                                        ? 'bg-primary-orange text-white'
                                        : 'bg-bg-input text-text-secondary'
                                        }`}
                                >
                                    <Icon className="w-5 h-5" />
                                </div>
                                <span className="flex-1 text-sm font-semibold">{item.label}</span>
                                {item.hint && (
                                    <kbd className="text-[10px] font-semibold text-text-muted bg-bg-input px-1.5 py-0.5 rounded border border-white/5">
                                        {item.hint}
                                    </kbd>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
