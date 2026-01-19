import { useState } from 'react';
import { ChevronDown, Edit3, Trash2, Plus, Upload, List, LayoutGrid } from 'lucide-react';

export function BookmarkGrid({
    bookmarks,
    groupedBookmarks,
    expandedFolders,
    toggleFolder,
    onEdit,
    onDelete,
    onAdd,
    onImport
}) {
    const getDomain = (url) => {
        try {
            return new URL(url).hostname.replace('www.', '');
        } catch {
            return url;
        }
    };

    const [viewModes, setViewModes] = useState({});

    const toggleView = (folder, e) => {
        e.stopPropagation();
        setViewModes(prev => ({
            ...prev,
            [folder]: prev[folder] === 'list' ? 'grid' : 'list'
        }));
    };

    if (bookmarks.length === 0) {
        return (
            <div className="text-center py-12 lg:py-10 px-6 bg-bg-card rounded-2xl border-2 border-dashed border-gray-200 my-3">
                <div className="text-5xl mb-3 animate-bounce">📑</div>
                <h2 className="text-xl font-semibold mb-1.5 text-text-primary">No bookmarks yet</h2>
                <p className="text-sm text-text-secondary mb-5 max-w-xs mx-auto">
                    Add your first bookmark or import from Chrome
                </p>
                <div className="flex gap-2.5 justify-center flex-wrap">
                    <button
                        className="flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-primary-orange text-white text-sm font-semibold shadow-orange hover:bg-primary-orange-hover hover:-translate-y-0.5 transition-all"
                        onClick={onAdd}
                    >
                        <Plus className="w-4 h-4" />
                        Add Bookmark
                    </button>
                    <label className="flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-bg-card text-text-primary text-sm font-semibold shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all cursor-pointer">
                        <Upload className="w-4 h-4" />
                        Import
                        <input type="file" accept=".html" onChange={onImport} hidden />
                    </label>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-5">
            {Object.entries(groupedBookmarks).map(([folder, items]) => {
                const currentView = viewModes[folder] || 'grid';

                return (
                    <div key={folder} className="bg-bg-card/50 rounded-2xl p-2 lg:p-0 lg:bg-transparent">
                        <div
                            className="flex items-center justify-between mb-2 lg:mb-3 cursor-pointer select-none pl-1 pr-1 lg:px-0"
                            onClick={() => toggleFolder(folder)}
                        >
                            <div className="flex items-center gap-2">
                                <div className={`transition-transform duration-200 ${expandedFolders[folder] ? 'rotate-0' : '-rotate-90'}`}>
                                    <ChevronDown className="w-4 h-4 text-text-muted" />
                                </div>
                                <h2 className="text-base lg:text-lg font-semibold text-text-primary">{folder}</h2>
                                <span className="px-2.5 py-0.5 rounded-full bg-primary-orange text-white text-xs font-semibold">
                                    {items.length}
                                </span>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (window.confirm(`Open all ${items.length} bookmarks in "${folder}"?`)) {
                                            items.forEach(bookmark => window.open(bookmark.url, '_blank'));
                                        }
                                    }}
                                    className="p-1.5 rounded-lg hover:bg-bg-input text-text-secondary transition-colors"
                                    title="Open All Bookmarks"
                                >
                                    <svg
                                        width="16"
                                        height="16"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        className="w-4 h-4"
                                    >
                                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                                        <polyline points="15 3 21 3 21 9" />
                                        <line x1="10" y1="14" x2="21" y2="3" />
                                    </svg>
                                </button>
                                <button
                                    onClick={(e) => toggleView(folder, e)}
                                    className="p-1.5 rounded-lg hover:bg-bg-input text-text-secondary transition-colors"
                                    title={currentView === 'grid' ? "Switch to List View" : "Switch to Grid View"}
                                >
                                    {currentView === 'grid' ? <List className="w-4 h-4" /> : <LayoutGrid className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        {expandedFolders[folder] && (
                            <div className={`animate-in fade-in slide-in-from-top-1 duration-200 ${currentView === 'grid'
                                ? "grid grid-cols-2 lg:grid-cols-4 gap-2 lg:gap-3"
                                : "flex flex-col gap-2"
                                }`}>
                                {items.map((bookmark, index) => (
                                    <div
                                        key={bookmark.id}
                                        className={`relative rounded-xl transition-all overflow-hidden group ${currentView === 'grid'
                                            ? `flex flex-col p-3 lg:p-4 min-h-25 lg:min-h-30 shadow-float hover:-translate-y-1 hover:shadow-2xl backdrop-blur-xl border border-white/10 ${index % 3 === 0 ? 'bg-accent-teal/80' : index % 3 === 1 ? 'bg-primary-orange/80' : 'bg-accent-coral/80'
                                            }`
                                            : "flex items-center gap-3 p-3 bg-bg-card hover:bg-bg-input border border-transparent hover:border-gray-200/50 shadow-sm"
                                            }`}
                                    >
                                        <a
                                            href={bookmark.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className={currentView === 'grid' ? "flex flex-col flex-1 text-white" : "flex items-center gap-3 flex-1 min-w-0"}
                                        >
                                            {currentView === 'list' && (
                                                <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0 text-lg overflow-hidden">
                                                    <img
                                                        src={`https://www.google.com/s2/favicons?domain=${getDomain(bookmark.url)}&sz=64`}
                                                        alt=""
                                                        className="w-5 h-5 object-contain"
                                                        onError={(e) => {
                                                            e.target.style.display = 'none';
                                                            e.target.parentElement.innerText = '🔗';
                                                        }}
                                                    />
                                                </div>
                                            )}

                                            <div className={currentView === 'grid' ? "contents" : "flex flex-col min-w-0"}>
                                                <span className={`${currentView === 'grid'
                                                    ? "font-semibold text-sm lg:text-base leading-tight line-clamp-2 mb-auto"
                                                    : "font-medium text-sm text-text-primary truncate"
                                                    }`}>
                                                    {bookmark.title}
                                                </span>
                                                <span className={`${currentView === 'grid'
                                                    ? "text-xs lg:text-sm font-medium text-white/90 mt-2 truncate"
                                                    : "text-xs text-text-muted truncate"
                                                    }`}>
                                                    {getDomain(bookmark.url)}
                                                </span>
                                            </div>
                                        </a>

                                        <div className={`${currentView === 'grid'
                                            ? "absolute top-1.5 right-1.5 lg:top-2 lg:right-2 flex gap-0.5 opacity-100 lg:opacity-0 lg:group-hover:opacity-100"
                                            : "flex gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100"
                                            } transition-opacity`}>
                                            <button
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    onEdit(bookmark);
                                                }}
                                                className={`rounded-md backdrop-blur-sm transition-colors ${currentView === 'grid'
                                                    ? "p-1 lg:p-1.5 bg-white/20 hover:bg-white/30"
                                                    : "p-1.5 hover:bg-gray-200 text-text-secondary"
                                                    }`}
                                            >
                                                <Edit3 className={`w-2.5 h-2.5 lg:w-3 lg:h-3 ${currentView === 'grid' ? 'text-white' : 'text-current'}`} />
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    onDelete(bookmark.id);
                                                }}
                                                className={`rounded-md backdrop-blur-sm transition-colors ${currentView === 'grid'
                                                    ? "p-1 lg:p-1.5 bg-white/20 hover:bg-white/30"
                                                    : "p-1.5 hover:bg-red-100 text-text-secondary hover:text-red-500"
                                                    }`}
                                            >
                                                <Trash2 className={`w-2.5 h-2.5 lg:w-3 lg:h-3 ${currentView === 'grid' ? 'text-white' : 'text-current'}`} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
