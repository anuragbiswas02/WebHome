import { useEffect, useMemo, useRef, useState } from 'react';
import {
    Search,
    Bookmark,
    Zap,
    Globe,
    Settings as SettingsIcon,
    Plus,
    Moon,
    Sun,
    Image as ImageIcon,
    Focus,
    ArrowRight,
    Download,
    Lock,
} from 'lucide-react';

const getFavicon = (url) => {
    try {
        const domain = new URL(url).hostname;
        return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
    } catch {
        return null;
    }
};

// Lightweight fuzzy-ish scorer: prefix > substring > token match
function score(query, text) {
    if (!query) return 1;
    const q = query.toLowerCase();
    const t = (text || '').toLowerCase();
    if (!t) return 0;
    if (t === q) return 1000;
    if (t.startsWith(q)) return 500;
    if (t.includes(q)) return 250;
    // token-wise match
    const tokens = q.split(/\s+/).filter(Boolean);
    if (tokens.length > 1 && tokens.every((tok) => t.includes(tok))) return 100;
    return 0;
}

export function CommandPalette({
    isOpen,
    onClose,
    bookmarks = [],
    shortcuts = [],
    engines = [],
    onOpenBookmark,
    onNavigateSettings,
    onAddBookmark,
    onToggleTheme,
    onShuffleWallpaper,
    onToggleFocus,
    onExportHTML,
    onExportJSON,
    onRelock,
    canRelock,
    focusActive,
    theme,
}) {
    const [query, setQuery] = useState('');
    const [selected, setSelected] = useState(0);
    const inputRef = useRef(null);
    const listRef = useRef(null);

    useEffect(() => {
        if (isOpen) {
            setQuery('');
            setSelected(0);
            // slight delay for animation
            requestAnimationFrame(() => inputRef.current?.focus());
        }
    }, [isOpen]);

    const actions = useMemo(
        () => [
            {
                id: 'action-add',
                type: 'action',
                title: 'Add new bookmark',
                hint: 'Create',
                icon: Plus,
                onRun: () => onAddBookmark?.(),
            },
            {
                id: 'action-theme',
                type: 'action',
                title: theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode',
                hint: 'Theme',
                icon: theme === 'dark' ? Sun : Moon,
                onRun: () => onToggleTheme?.(),
            },
            {
                id: 'action-wallpaper',
                type: 'action',
                title: 'Shuffle wallpaper',
                hint: 'Background',
                icon: ImageIcon,
                onRun: () => onShuffleWallpaper?.(),
            },
            {
                id: 'action-focus',
                type: 'action',
                title: focusActive ? 'Exit focus mode' : 'Enter focus mode',
                hint: 'View',
                icon: Focus,
                onRun: () => onToggleFocus?.(),
            },
            {
                id: 'action-export-html',
                type: 'action',
                title: 'Export bookmarks (Chrome HTML)',
                hint: 'Export',
                icon: Download,
                onRun: () => onExportHTML?.(),
            },
            {
                id: 'action-export-json',
                type: 'action',
                title: 'Export JSON backup',
                hint: 'Export',
                icon: Download,
                onRun: () => onExportJSON?.(),
            },
            canRelock
                ? {
                    id: 'action-relock',
                    type: 'action',
                    title: 'Lock again',
                    hint: 'Privacy',
                    icon: Lock,
                    onRun: () => onRelock?.(),
                }
                : null,
            {
                id: 'action-settings',
                type: 'action',
                title: 'Open settings',
                hint: 'Navigate',
                icon: SettingsIcon,
                onRun: () => onNavigateSettings?.(),
            },
        ].filter(Boolean),
        [onAddBookmark, onToggleTheme, onShuffleWallpaper, onToggleFocus, onNavigateSettings, onExportHTML, onExportJSON, onRelock, canRelock, theme, focusActive],
    );

    const results = useMemo(() => {
        const q = query.trim();
        const candidates = [
            ...bookmarks.map((b) => ({
                id: `bm-${b.id}`,
                type: 'bookmark',
                title: b.title,
                subtitle: b.folder || 'Uncategorized',
                url: b.url,
                raw: b,
            })),
            ...shortcuts.map((s) => ({
                id: `sc-${s.id}`,
                type: 'shortcut',
                title: s.title,
                subtitle: 'Quick Link',
                url: s.url,
                raw: s,
            })),
            ...engines.map((e) => ({
                id: `se-${e.id}`,
                type: 'engine',
                title: `Search ${e.name}${q ? `: "${q}"` : ''}`,
                subtitle: e.url,
                url: e.url,
                raw: e,
            })),
            ...actions,
        ];

        const scored = candidates
            .map((c) => {
                if (c.type === 'engine') {
                    // Always keep engines visible if there's a query
                    return { ...c, score: q ? 300 : 50 };
                }
                if (c.type === 'action') {
                    return { ...c, score: score(q, c.title) + (q ? 0 : 1) };
                }
                const s = Math.max(
                    score(q, c.title),
                    score(q, c.subtitle) * 0.5,
                    score(q, c.url) * 0.4,
                );
                return { ...c, score: s };
            })
            .filter((c) => c.score > 0)
            .sort((a, b) => b.score - a.score)
            .slice(0, 40);

        return scored;
    }, [query, bookmarks, shortcuts, engines, actions]);

    useEffect(() => {
        setSelected(0);
    }, [query, results.length]);

    useEffect(() => {
        if (!isOpen) return;
        const onKey = (e) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                onClose();
                return;
            }
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelected((i) => Math.min(i + 1, results.length - 1));
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelected((i) => Math.max(i - 1, 0));
            } else if (e.key === 'Enter') {
                e.preventDefault();
                const item = results[selected];
                if (item) runItem(item);
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [isOpen, results, selected, onClose]);

    useEffect(() => {
        const el = listRef.current?.querySelector(`[data-idx="${selected}"]`);
        el?.scrollIntoView({ block: 'nearest' });
    }, [selected]);

    const runItem = (item) => {
        if (item.type === 'action') {
            item.onRun?.();
            onClose();
            return;
        }
        if (item.type === 'engine') {
            const q = query.trim();
            if (!q) return;
            window.open(item.url + encodeURIComponent(q), '_blank');
            onClose();
            return;
        }
        if (item.type === 'bookmark' || item.type === 'shortcut') {
            onOpenBookmark?.(item.raw, item.type);
            window.open(item.url, '_blank');
            onClose();
            return;
        }
    };

    if (!isOpen) return null;

    const iconFor = (item) => {
        if (item.type === 'action') return item.icon || ArrowRight;
        if (item.type === 'engine') return Globe;
        if (item.type === 'shortcut') return Zap;
        return Bookmark;
    };

    return (
        <div
            className="fixed inset-0 z-[250] flex items-start justify-center pt-16 lg:pt-32 p-4 bg-black/50 backdrop-blur-sm anim-backdrop"
            onClick={onClose}
        >
            <div
                className="w-full max-w-xl bg-bg-card rounded-2xl shadow-float border border-white/10 overflow-hidden anim-pop"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5">
                    <Search className="w-5 h-5 text-text-muted shrink-0" />
                    <input
                        ref={inputRef}
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search bookmarks, shortcuts, run actions…"
                        className="flex-1 bg-transparent outline-none text-base text-text-primary placeholder:text-text-muted"
                    />
                    <kbd className="hidden sm:flex text-[10px] font-semibold text-text-muted bg-bg-input px-1.5 py-0.5 rounded">ESC</kbd>
                </div>

                <div
                    ref={listRef}
                    className="max-h-[50vh] overflow-y-auto no-scrollbar py-2"
                >
                    {results.length === 0 ? (
                        <div className="px-4 py-8 text-center text-sm text-text-muted">
                            No matches. Press <kbd className="text-xs bg-bg-input px-1 py-0.5 rounded mx-1">Enter</kbd> after typing to search the web.
                        </div>
                    ) : (
                        results.map((item, idx) => {
                            const Icon = iconFor(item);
                            const isSel = idx === selected;
                            const fav = (item.type === 'bookmark' || item.type === 'shortcut') ? getFavicon(item.url) : null;
                            return (
                                <button
                                    key={item.id}
                                    data-idx={idx}
                                    onMouseEnter={() => setSelected(idx)}
                                    onClick={() => runItem(item)}
                                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${isSel ? 'bg-primary-orange/10' : 'hover:bg-bg-input'
                                        }`}
                                >
                                    <div className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${isSel ? 'bg-primary-orange/20 text-primary-orange' : 'bg-bg-input text-text-secondary'
                                        }`}>
                                        {fav ? (
                                            <img
                                                src={fav}
                                                alt=""
                                                className="w-4 h-4 object-contain"
                                                onError={(e) => {
                                                    e.currentTarget.style.display = 'none';
                                                }}
                                            />
                                        ) : (
                                            <Icon className="w-4 h-4" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-medium text-text-primary truncate">
                                            {item.title}
                                        </div>
                                        {item.subtitle && (
                                            <div className="text-xs text-text-muted truncate">
                                                {item.subtitle}
                                            </div>
                                        )}
                                    </div>
                                    {item.type === 'action' && item.hint && (
                                        <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wider text-text-muted bg-bg-input px-2 py-0.5 rounded">
                                            {item.hint}
                                        </span>
                                    )}
                                    {isSel && (
                                        <ArrowRight className="w-4 h-4 text-primary-orange shrink-0" />
                                    )}
                                </button>
                            );
                        })
                    )}
                </div>

                <div className="flex items-center justify-between px-4 py-2 border-t border-white/5 bg-bg-input/40 text-[11px] text-text-muted">
                    <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                            <kbd className="bg-bg-card px-1.5 py-0.5 rounded border border-white/5">↑</kbd>
                            <kbd className="bg-bg-card px-1.5 py-0.5 rounded border border-white/5">↓</kbd>
                            navigate
                        </span>
                        <span className="flex items-center gap-1">
                            <kbd className="bg-bg-card px-1.5 py-0.5 rounded border border-white/5">↵</kbd>
                            open
                        </span>
                    </div>
                    <span className="hidden sm:block">WebHome</span>
                </div>
            </div>
        </div>
    );
}
