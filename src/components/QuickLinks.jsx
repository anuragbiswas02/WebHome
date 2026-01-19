import { useState } from 'react';
import { Plus, X, Globe, MoreVertical, Edit2, Trash2 } from 'lucide-react';

export function QuickLinks({ shortcuts, onAdd, onDelete, onEdit }) {
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

    const [activeMenu, setActiveMenu] = useState(null);

    return (
        <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-4 lg:gap-6 mt-8 lg:mt-10 px-4 lg:px-0 pb-4 lg:pb-0 w-full relative z-10">
            {shortcuts.map((shortcut) => (
                <div key={shortcut.id} className="group relative flex flex-col items-center gap-2 lg:gap-3">
                    <a
                        href={shortcut.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="relative w-12 h-12 lg:w-14 lg:h-14 rounded-full bg-bg-card flex items-center justify-center hover:bg-bg-input transition-all shadow-sm hover:shadow-md group/icon"
                    >
                        <img
                            src={getFavicon(shortcut.url)}
                            alt={shortcut.title}
                            className="w-6 h-6 lg:w-7 lg:h-7 object-contain rounded-full"
                            onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.parentElement.innerText = '';
                                e.target.parentElement.appendChild(document.createElement('span')).textContent = '🌐';
                            }}
                        />

                        {/* Edit/Delete Menu Trigger */}
                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setActiveMenu(activeMenu === shortcut.id ? null : shortcut.id);
                            }}
                            className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-bg-card shadow-md opacity-0 group-hover/icon:opacity-100 flex items-center justify-center transition-opacity z-10 hover:bg-gray-100"
                        >
                            <MoreVertical className="w-3 h-3 text-text-secondary" />
                        </button>
                    </a>

                    {/* Context Menu */}
                    {activeMenu === shortcut.id && (
                        <div className="absolute top-10 left-1/2 -translate-x-1/2 z-50 w-32 bg-bg-card rounded-lg shadow-xl border border-gray-100 py-1 animate-in fade-in zoom-in-95 duration-100">
                            <button
                                onClick={() => {
                                    onEdit(shortcut);
                                    setActiveMenu(null);
                                }}
                                className="w-full px-3 py-2 text-left text-xs font-medium text-text-primary hover:bg-bg-input flex items-center gap-2"
                            >
                                <Edit2 className="w-3 h-3" /> Edit
                            </button>
                            <button
                                onClick={() => {
                                    onDelete(shortcut.id);
                                    setActiveMenu(null);
                                }}
                                className="w-full px-3 py-2 text-left text-xs font-medium text-red-500 hover:bg-red-50 flex items-center gap-2"
                            >
                                <Trash2 className="w-3 h-3" /> Remove
                            </button>
                        </div>
                    )}

                    {/* Click outside to close menu */}
                    {activeMenu === shortcut.id && (
                        <div
                            className="fixed inset-0 z-40 cursor-default"
                            onClick={() => setActiveMenu(null)}
                        />
                    )}

                    <span className="text-xs lg:text-sm font-medium text-text-primary text-center truncate w-full px-1 shadow-black/20 drop-shadow-sm select-none">
                        {shortcut.title}
                    </span>
                </div>
            ))}

            <button
                onClick={onAdd}
                className="flex flex-col items-center gap-2 lg:gap-3 group"
            >
                <div className="w-12 h-12 lg:w-14 lg:h-14 rounded-full bg-bg-card flex items-center justify-center hover:bg-bg-input transition-all shadow-sm hover:shadow-md border-2 border-dashed border-gray-300 hover:border-primary-orange">
                    <Plus className="w-5 h-5 lg:w-6 lg:h-6 text-text-secondary group-hover:text-primary-orange group-hover:scale-110 transition-all" />
                </div>
                <span className="text-xs font-medium text-text-secondary text-center truncate w-full px-1 select-none group-hover:text-text-primary transition-colors">
                    Add
                </span>
            </button>
        </div>
    );
}
