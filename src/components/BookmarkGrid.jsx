import { useState, useEffect } from 'react';
import {
    ChevronDown,
    Edit3,
    Trash2,
    Plus,
    Upload,
    List,
    LayoutGrid,
    Pin,
    PinOff,
    StickyNote,
    ExternalLink,
    GripVertical,
    Check,
    CheckSquare,
    Lock,
    LockOpen,
    MoreVertical,
} from 'lucide-react';
import { useConfirm } from '../hooks/useConfirm';
import { usePrivacy } from '../hooks/usePrivacy';

const getDomain = (url) => {
    try {
        return new URL(url).hostname.replace('www.', '');
    } catch {
        return url;
    }
};

const getFavicon = (url) => {
    try {
        const domain = new URL(url).hostname;
        return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
    } catch {
        return null;
    }
};

const VIEW_KEY = 'folderViewModes';

export function BookmarkGrid({
    bookmarks,
    groupedBookmarks,
    expandedFolders,
    toggleFolder,
    onEdit,
    onDelete,
    onAdd,
    onImport,
    onTogglePin,
    onRecordVisit,
    onReorder,
    selectMode,
    selectedIds,
    onToggleSelect,
    onSelectFolder,
}) {
    const confirm = useConfirm();
    const {
        hasPassword,
        isFolderLocked,
        isBookmarkLocked,
        canShowLocked,
        requireUnlock,
        lockFolder,
        unlockFolderPersistent,
    } = usePrivacy();

    const [viewModes, setViewModes] = useState(() => {
        try {
            const saved = localStorage.getItem(VIEW_KEY);
            return saved ? JSON.parse(saved) : {};
        } catch {
            return {};
        }
    });

    useEffect(() => {
        localStorage.setItem(VIEW_KEY, JSON.stringify(viewModes));
    }, [viewModes]);

    const [dragId, setDragId] = useState(null);
    const [dragOverId, setDragOverId] = useState(null);
    const [folderMenuOpen, setFolderMenuOpen] = useState(null);

    useEffect(() => {
        if (!folderMenuOpen) return;
        const close = () => setFolderMenuOpen(null);
        document.addEventListener('click', close);
        return () => document.removeEventListener('click', close);
    }, [folderMenuOpen]);

    const toggleView = (folder, e) => {
        e.stopPropagation();
        setViewModes((prev) => ({
            ...prev,
            [folder]: prev[folder] === 'list' ? 'grid' : 'list',
        }));
    };

    const handleOpenAll = async (folder, items) => {
        const ok = await confirm({
            title: `Open all ${items.length} bookmarks?`,
            description: `This will open every bookmark in "${folder}" in new tabs.`,
            confirmLabel: 'Open all',
        });
        if (ok) items.forEach((b) => window.open(b.url, '_blank'));
    };

    const handleDelete = async (bookmark) => {
        const ok = await confirm({
            title: 'Delete bookmark?',
            description: `"${bookmark.title}" will be removed.`,
            confirmLabel: 'Delete',
            destructive: true,
        });
        if (ok) onDelete(bookmark.id);
    };

    const handleBookmarkOpen = async (e, bookmark) => {
        if (selectMode) return;
        const locked = isBookmarkLocked(bookmark);
        if (!locked || canShowLocked) {
            onRecordVisit?.(bookmark.id);
            return;
        }
        // Block the navigation until unlocked
        e.preventDefault();
        const ok = await requireUnlock({
            reason: `"${bookmark.title}" is locked`,
        });
        if (ok) {
            onRecordVisit?.(bookmark.id);
            window.open(bookmark.url, '_blank');
        }
    };

    if (bookmarks.length === 0) {
        return (
            <div className="text-center py-12 lg:py-14 px-6 bg-bg-card/50 rounded-2xl border-2 border-dashed border-white/10 my-3">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary-orange/15 flex items-center justify-center">
                    <span className="text-3xl">📑</span>
                </div>
                <h2 className="text-xl font-semibold mb-1.5 text-text-primary">No bookmarks yet</h2>
                <p className="text-sm text-text-secondary mb-5 max-w-xs mx-auto">
                    Add your first bookmark or import your Chrome/Firefox bookmarks.
                </p>
                <div className="flex gap-2.5 justify-center flex-wrap">
                    <button
                        className="flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-primary-orange text-white text-sm font-semibold shadow-orange hover:shadow-lg hover:-translate-y-0.5 transition-all"
                        onClick={onAdd}
                    >
                        <Plus className="w-4 h-4" />
                        Add Bookmark
                    </button>
                    <label className="flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-bg-card text-text-primary text-sm font-semibold shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all cursor-pointer border border-white/10">
                        <Upload className="w-4 h-4" />
                        Import
                        <input type="file" accept=".html,.json" onChange={onImport} hidden />
                    </label>
                </div>
                <p className="text-xs text-text-muted mt-5">
                    Tip: press <kbd className="bg-bg-input px-1.5 py-0.5 rounded border border-white/10">⌘K</kbd> to open the command palette.
                </p>
            </div>
        );
    }

    const selSet = selectedIds || new Set();

    return (
        <div className="space-y-5">
            {Object.entries(groupedBookmarks).map(([folder, items]) => {
                const currentView = viewModes[folder] || 'grid';
                const isExpanded = expandedFolders[folder];
                const folderLocked = isFolderLocked(folder);
                const sortedItems = [...items].sort((a, b) => !!b.pinned - !!a.pinned);
                const folderSelectedCount = items.filter((b) => selSet.has(b.id)).length;
                const hideContents = folderLocked && !canShowLocked;

                return (
                    <div key={folder} className="bg-bg-card/40 rounded-2xl p-2 lg:p-0 lg:bg-transparent">
                        <div
                            className="flex items-center justify-between mb-2 lg:mb-3 cursor-pointer select-none pl-1 pr-1 lg:px-0"
                            onClick={async () => {
                                if (hideContents) {
                                    const ok = await requireUnlock({
                                        reason: `"${folder}" is locked`,
                                    });
                                    if (!ok) return;
                                }
                                toggleFolder(folder);
                            }}
                        >
                            <div className="flex items-center gap-2 min-w-0">
                                <div
                                    className={`transition-transform duration-200 shrink-0 ${isExpanded && !hideContents ? 'rotate-0' : '-rotate-90'
                                        }`}
                                >
                                    <ChevronDown className="w-4 h-4 text-text-muted" />
                                </div>
                                <h2 className="text-base lg:text-lg font-semibold text-text-primary truncate">{folder}</h2>
                                <span className="px-2 py-0.5 rounded-full bg-primary-orange text-white text-[11px] font-semibold shrink-0">
                                    {items.length}
                                </span>
                                {folderLocked && (
                                    <Lock className="w-3.5 h-3.5 text-primary-orange shrink-0" />
                                )}
                            </div>

                            <div className="flex items-center gap-0.5 shrink-0">
                                {selectMode && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onSelectFolder?.(folder, folderSelectedCount !== items.length);
                                        }}
                                        className={`p-1.5 rounded-lg transition-colors ${folderSelectedCount === items.length
                                            ? 'bg-primary-orange text-white'
                                            : folderSelectedCount > 0
                                                ? 'bg-primary-orange/30 text-primary-orange'
                                                : 'hover:bg-bg-input text-text-secondary'
                                            }`}
                                        title={folderSelectedCount === items.length ? 'Deselect folder' : 'Select folder'}
                                    >
                                        <CheckSquare className="w-4 h-4" />
                                    </button>
                                )}
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleOpenAll(folder, items);
                                    }}
                                    className="p-1.5 rounded-lg hover:bg-bg-input text-text-secondary transition-colors"
                                    title="Open All Bookmarks"
                                >
                                    <ExternalLink className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={(e) => toggleView(folder, e)}
                                    className="p-1.5 rounded-lg hover:bg-bg-input text-text-secondary transition-colors"
                                    title={currentView === 'grid' ? 'Switch to List View' : 'Switch to Grid View'}
                                >
                                    {currentView === 'grid' ? <List className="w-4 h-4" /> : <LayoutGrid className="w-4 h-4" />}
                                </button>
                                <div className="relative">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setFolderMenuOpen(folderMenuOpen === folder ? null : folder);
                                        }}
                                        className="p-1.5 rounded-lg hover:bg-bg-input text-text-secondary transition-colors"
                                        title="More"
                                    >
                                        <MoreVertical className="w-4 h-4" />
                                    </button>
                                    {folderMenuOpen === folder && (
                                        <div
                                            onClick={(e) => e.stopPropagation()}
                                            className="absolute right-0 top-full mt-1 min-w-[180px] bg-bg-card rounded-xl shadow-float border border-white/10 z-30 py-1 anim-scale-in"
                                        >
                                            <button
                                                onClick={async () => {
                                                    setFolderMenuOpen(null);
                                                    if (folderLocked) {
                                                        const ok = await requireUnlock({
                                                            reason: `Unlock "${folder}"`,
                                                        });
                                                        if (ok) unlockFolderPersistent(folder);
                                                    } else {
                                                        if (!hasPassword) {
                                                            // Triggering lock without a password opens the setup modal first
                                                            window.dispatchEvent(
                                                                new CustomEvent('webhome:setup-password', {
                                                                    detail: { then: 'lockFolder', folder },
                                                                }),
                                                            );
                                                            return;
                                                        }
                                                        lockFolder(folder);
                                                    }
                                                }}
                                                className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left text-sm hover:bg-bg-input transition-colors text-text-primary"
                                            >
                                                {folderLocked ? (
                                                    <>
                                                        <LockOpen className="w-4 h-4 text-primary-orange" />
                                                        <span>Unlock folder</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Lock className="w-4 h-4 text-primary-orange" />
                                                        <span>Lock folder</span>
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {isExpanded && hideContents && (
                            <button
                                onClick={async () => {
                                    const ok = await requireUnlock({
                                        reason: `"${folder}" is locked`,
                                    });
                                    if (ok) toggleFolder(folder);
                                }}
                                className="w-full flex items-center justify-center gap-2 py-8 rounded-xl bg-bg-card/50 border-2 border-dashed border-white/10 text-text-muted hover:text-primary-orange hover:border-primary-orange/30 transition-colors anim-fade-in"
                            >
                                <Lock className="w-4 h-4" />
                                <span className="text-sm font-semibold">Folder locked — tap to unlock</span>
                            </button>
                        )}

                        {isExpanded && !hideContents && (
                            <div
                                className={`anim-fade-in ${currentView === 'grid'
                                    ? 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 lg:gap-3'
                                    : 'flex flex-col gap-1.5'
                                    }`}
                            >
                                {sortedItems.map((bookmark, index) => {
                                    const fav = getFavicon(bookmark.url);
                                    const isGrid = currentView === 'grid';
                                    const isDragging = dragId === bookmark.id;
                                    const isDragOver = dragOverId === bookmark.id && dragId !== bookmark.id;
                                    const isSelected = selSet.has(bookmark.id);
                                    const bmLocked = isBookmarkLocked(bookmark);
                                    const blurContent = bmLocked && !canShowLocked;

                                    return (
                                        <div
                                            key={bookmark.id}
                                            draggable={!selectMode}
                                            onDragStart={(e) => {
                                                setDragId(bookmark.id);
                                                e.dataTransfer.effectAllowed = 'move';
                                            }}
                                            onDragOver={(e) => {
                                                e.preventDefault();
                                                if (dragId && dragId !== bookmark.id) setDragOverId(bookmark.id);
                                            }}
                                            onDragLeave={() => {
                                                if (dragOverId === bookmark.id) setDragOverId(null);
                                            }}
                                            onDrop={(e) => {
                                                e.preventDefault();
                                                if (dragId && dragId !== bookmark.id) {
                                                    onReorder?.(folder, dragId, bookmark.id);
                                                }
                                                setDragId(null);
                                                setDragOverId(null);
                                            }}
                                            onDragEnd={() => {
                                                setDragId(null);
                                                setDragOverId(null);
                                            }}
                                            className={`relative rounded-xl transition-all overflow-hidden group ${isDragging ? 'opacity-40' : ''
                                                } ${isDragOver ? 'ring-2 ring-primary-orange' : ''} ${isSelected ? 'ring-2 ring-primary-orange' : ''} ${isGrid
                                                    ? `flex flex-col p-3 lg:p-4 min-h-[100px] lg:min-h-[120px] shadow-float hover:-translate-y-1 hover:shadow-2xl backdrop-blur-xl border border-white/10 ${index % 3 === 0
                                                        ? 'bg-accent-teal/80'
                                                        : index % 3 === 1
                                                            ? 'bg-primary-orange/80'
                                                            : 'bg-accent-coral/80'
                                                    }`
                                                    : 'flex items-center gap-3 p-2.5 lg:p-3 bg-bg-card hover:bg-bg-input border border-white/5 hover:border-primary-orange/30 shadow-sm'
                                                }`}
                                        >
                                            {selectMode && (
                                                <button
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        onToggleSelect?.(bookmark.id);
                                                    }}
                                                    className={`absolute top-1.5 left-1.5 z-10 w-6 h-6 rounded-md flex items-center justify-center border-2 transition-all ${isSelected
                                                        ? 'bg-primary-orange border-primary-orange text-white'
                                                        : isGrid
                                                            ? 'bg-white/30 border-white/60 backdrop-blur'
                                                            : 'bg-bg-card border-text-muted/40'
                                                        }`}
                                                    aria-label={isSelected ? 'Deselect' : 'Select'}
                                                >
                                                    {isSelected && <Check className="w-4 h-4" strokeWidth={3} />}
                                                </button>
                                            )}

                                            {selectMode ? (
                                                <button
                                                    type="button"
                                                    onClick={() => onToggleSelect?.(bookmark.id)}
                                                    className={isGrid ? 'flex flex-col flex-1 text-white text-left' : 'flex items-center gap-3 flex-1 min-w-0 text-left'}
                                                >
                                                    {renderBookmarkContent(bookmark, fav, isGrid, blurContent)}
                                                </button>
                                            ) : (
                                                <a
                                                    href={bookmark.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    onClick={(e) => handleBookmarkOpen(e, bookmark)}
                                                    className={isGrid ? 'flex flex-col flex-1 text-white' : 'flex items-center gap-3 flex-1 min-w-0'}
                                                >
                                                    {renderBookmarkContent(bookmark, fav, isGrid, blurContent)}
                                                </a>
                                            )}

                                            {!selectMode && (
                                                <div
                                                    className={`${isGrid
                                                        ? 'absolute top-1.5 right-1.5 lg:top-2 lg:right-2 flex gap-0.5 opacity-100 lg:opacity-0 lg:group-hover:opacity-100'
                                                        : 'flex gap-0.5 opacity-100 lg:opacity-0 lg:group-hover:opacity-100'
                                                        } transition-opacity`}
                                                >
                                                    <button
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            onTogglePin?.(bookmark.id);
                                                        }}
                                                        className={`rounded-md backdrop-blur-sm transition-colors ${isGrid
                                                            ? 'p-1 lg:p-1.5 bg-white/20 hover:bg-white/30'
                                                            : 'p-1.5 hover:bg-bg-input text-text-secondary'
                                                            }`}
                                                        title={bookmark.pinned ? 'Unpin' : 'Pin to top'}
                                                    >
                                                        {bookmark.pinned ? (
                                                            <PinOff className={`w-3 h-3 ${isGrid ? 'text-white' : 'text-current'}`} />
                                                        ) : (
                                                            <Pin className={`w-3 h-3 ${isGrid ? 'text-white' : 'text-current'}`} />
                                                        )}
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            onEdit(bookmark);
                                                        }}
                                                        className={`rounded-md backdrop-blur-sm transition-colors ${isGrid
                                                            ? 'p-1 lg:p-1.5 bg-white/20 hover:bg-white/30'
                                                            : 'p-1.5 hover:bg-bg-input text-text-secondary'
                                                            }`}
                                                        title="Edit"
                                                    >
                                                        <Edit3 className={`w-3 h-3 ${isGrid ? 'text-white' : 'text-current'}`} />
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            handleDelete(bookmark);
                                                        }}
                                                        className={`rounded-md backdrop-blur-sm transition-colors ${isGrid
                                                            ? 'p-1 lg:p-1.5 bg-white/20 hover:bg-white/30'
                                                            : 'p-1.5 hover:bg-red-100 dark:hover:bg-red-500/20 text-text-secondary hover:text-red-500'
                                                            }`}
                                                        title="Delete"
                                                    >
                                                        <Trash2 className={`w-3 h-3 ${isGrid ? 'text-white' : 'text-current'}`} />
                                                    </button>
                                                </div>
                                            )}

                                            {!isGrid && !selectMode && (
                                                <GripVertical className="w-4 h-4 text-text-muted opacity-0 group-hover:opacity-60 transition-opacity cursor-grab active:cursor-grabbing" />
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}

function renderBookmarkContent(bookmark, fav, isGrid, locked) {
    if (isGrid) {
        return (
            <>
                <div className="flex items-center gap-2 mb-2">
                    <div className="w-7 h-7 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center overflow-hidden shrink-0">
                        {locked ? (
                            <Lock className="w-3.5 h-3.5 text-white" />
                        ) : fav ? (
                            <img
                                src={fav}
                                alt=""
                                className="w-4 h-4 object-contain"
                                onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                }}
                            />
                        ) : (
                            <span className="text-sm">🔗</span>
                        )}
                    </div>
                    {bookmark.pinned && <Pin className="w-3 h-3 text-white fill-current" />}
                    {bookmark.notes && !locked && (
                        <StickyNote className="w-3 h-3 text-white/90" title={bookmark.notes} />
                    )}
                    {locked && <Lock className="w-3 h-3 text-white fill-current" title="Locked" />}
                </div>
                <span className={`font-semibold text-sm lg:text-base leading-tight line-clamp-2 mb-auto ${locked ? 'blur-sm select-none' : ''}`}>
                    {locked ? '••••••••' : bookmark.title}
                </span>
                <span className={`text-xs lg:text-sm font-medium text-white/90 mt-2 truncate ${locked ? 'blur-sm select-none' : ''}`}>
                    {locked ? '••••' : getDomain(bookmark.url)}
                </span>
            </>
        );
    }
    return (
        <>
            <div className="w-8 h-8 rounded-lg bg-bg-input flex items-center justify-center shrink-0 overflow-hidden">
                {locked ? (
                    <Lock className="w-4 h-4 text-primary-orange" />
                ) : fav ? (
                    <img
                        src={fav}
                        alt=""
                        className="w-5 h-5 object-contain"
                        onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.parentElement.innerText = '🔗';
                        }}
                    />
                ) : (
                    <span className="text-base">🔗</span>
                )}
            </div>
            <div className="flex flex-col min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                    <span className={`font-medium text-sm text-text-primary truncate ${locked ? 'blur-sm select-none' : ''}`}>
                        {locked ? '••••••••' : bookmark.title}
                    </span>
                    {bookmark.pinned && <Pin className="w-3 h-3 text-primary-orange fill-current shrink-0" />}
                    {bookmark.notes && !locked && (
                        <StickyNote className="w-3 h-3 text-accent-teal shrink-0" title={bookmark.notes} />
                    )}
                    {locked && <Lock className="w-3 h-3 text-primary-orange fill-current shrink-0" />}
                </div>
                <span className={`text-xs text-text-muted truncate ${locked ? 'blur-sm select-none' : ''}`}>
                    {locked ? '••••••••' : getDomain(bookmark.url)}
                </span>
            </div>
        </>
    );
}
