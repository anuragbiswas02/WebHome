import { useState, useEffect, useRef } from 'react';
import { X, FolderInput, Trash2, FolderPlus, Pin } from 'lucide-react';

export function BulkActionBar({
    selectedCount,
    onCancel,
    onMove,
    onDelete,
    onTogglePin,
    availableFolders = [],
}) {
    const [showFolders, setShowFolders] = useState(false);
    const [newName, setNewName] = useState('');
    const [creating, setCreating] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        if (!showFolders) return;
        const close = (e) => {
            if (!dropdownRef.current?.contains(e.target)) setShowFolders(false);
        };
        document.addEventListener('mousedown', close);
        return () => document.removeEventListener('mousedown', close);
    }, [showFolders]);

    const handleMove = (folder) => {
        onMove(folder);
        setShowFolders(false);
        setCreating(false);
        setNewName('');
    };

    return (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[120] w-[calc(100%-1.5rem)] max-w-md">
            <div className="flex items-center gap-1 bg-bg-card/95 backdrop-blur-xl rounded-2xl shadow-float border border-white/10 px-2 py-2 anim-slide-up">
                <button
                    onClick={onCancel}
                    className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center hover:bg-bg-input text-text-secondary"
                    title="Cancel"
                >
                    <X className="w-5 h-5" />
                </button>
                <div className="flex-1 px-2 text-sm font-semibold text-text-primary">
                    {selectedCount} selected
                </div>

                <button
                    onClick={onTogglePin}
                    className="px-3 h-9 rounded-xl flex items-center gap-1.5 text-text-primary hover:bg-bg-input transition-colors text-sm"
                    title="Toggle pin"
                >
                    <Pin className="w-4 h-4" />
                </button>

                <div className="relative">
                    <button
                        onClick={() => setShowFolders((v) => !v)}
                        className="px-3 h-9 rounded-xl flex items-center gap-1.5 text-text-primary hover:bg-bg-input transition-colors text-sm"
                    >
                        <FolderInput className="w-4 h-4" />
                        <span className="hidden sm:inline">Move</span>
                    </button>
                    {showFolders && (
                        <div
                            ref={dropdownRef}
                            className="absolute bottom-full mb-2 right-0 w-56 bg-bg-card rounded-xl shadow-float border border-white/10 max-h-64 overflow-y-auto animate-in fade-in slide-in-from-bottom-2 duration-150"
                        >
                            {creating ? (
                                <div className="p-2 border-b border-white/5">
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            autoFocus
                                            value={newName}
                                            onChange={(e) => setNewName(e.target.value)}
                                            placeholder="New group name"
                                            className="flex-1 py-1.5 px-2.5 rounded-lg bg-bg-input text-sm focus:outline-none focus:ring-2 focus:ring-primary-orange"
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && newName.trim()) {
                                                    handleMove(newName.trim());
                                                }
                                            }}
                                        />
                                        <button
                                            onClick={() => newName.trim() && handleMove(newName.trim())}
                                            disabled={!newName.trim()}
                                            className="px-2.5 py-1.5 rounded-lg bg-primary-orange text-white text-xs font-semibold disabled:opacity-50"
                                        >
                                            Add
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <button
                                    onClick={() => setCreating(true)}
                                    className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left text-primary-orange hover:bg-primary-orange/10 transition-colors border-b border-white/5 text-sm font-semibold"
                                >
                                    <FolderPlus className="w-4 h-4" />
                                    Create new group
                                </button>
                            )}
                            <button
                                onClick={() => handleMove('')}
                                className="w-full px-3 py-2.5 text-left text-sm hover:bg-bg-input transition-colors text-text-secondary"
                            >
                                No group (Uncategorized)
                            </button>
                            {availableFolders.map((f) => (
                                <button
                                    key={f}
                                    onClick={() => handleMove(f)}
                                    className="w-full px-3 py-2.5 text-left text-sm hover:bg-bg-input transition-colors text-text-primary font-medium"
                                >
                                    {f}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <button
                    onClick={onDelete}
                    className="px-3 h-9 rounded-xl flex items-center gap-1.5 text-red-500 hover:bg-red-500/10 transition-colors text-sm"
                    title="Delete"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}
