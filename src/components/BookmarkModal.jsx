import { useState, useEffect, useRef } from 'react';
import { X, FolderPlus, ChevronDown, Check, StickyNote, Lock } from 'lucide-react';
import { usePrivacy } from '../hooks/usePrivacy';

const normalizeUrl = (raw) => {
    let url = (raw || '').trim();
    if (!url) return '';
    if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
    return url;
};

const validateUrl = (raw) => {
    const url = normalizeUrl(raw);
    try {
        const u = new URL(url);
        if (!u.hostname.includes('.')) return { valid: false, error: 'Enter a valid URL' };
        return { valid: true, url };
    } catch {
        return { valid: false, error: 'Enter a valid URL' };
    }
};

export function BookmarkModal({ isOpen, onClose, onSave, initialData, availableFolders }) {
    const { hasPassword } = usePrivacy();
    const [formData, setFormData] = useState({
        title: '',
        url: '',
        folder: '',
        notes: '',
        locked: false,
    });
    const [showFolderDropdown, setShowFolderDropdown] = useState(false);
    const [isCreatingFolder, setIsCreatingFolder] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');
    const [urlError, setUrlError] = useState('');
    const titleRef = useRef(null);

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setFormData({
                    title: initialData.title || '',
                    url: initialData.url || '',
                    folder: initialData.folder || '',
                    notes: initialData.notes || '',
                    locked: Boolean(initialData.locked),
                });
            } else {
                setFormData({ title: '', url: '', folder: '', notes: '', locked: false });
            }
            setShowFolderDropdown(false);
            setIsCreatingFolder(false);
            setNewFolderName('');
            setUrlError('');
            setTimeout(() => titleRef.current?.focus(), 100);
        }
    }, [isOpen, initialData]);

    useEffect(() => {
        if (!isOpen) return;
        const onKey = (e) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [isOpen, onClose]);

    const handleSubmit = (e) => {
        e.preventDefault();
        const check = validateUrl(formData.url);
        if (!check.valid) {
            setUrlError(check.error);
            return;
        }
        let title = formData.title.trim();
        if (!title) {
            try {
                title = new URL(check.url).hostname.replace('www.', '');
            } catch {
                title = 'Bookmark';
            }
        }
        onSave({
            title,
            url: check.url,
            folder: formData.folder,
            notes: formData.notes.trim(),
            locked: Boolean(formData.locked),
        });
        onClose();
    };

    const handleSelectFolder = (folder) => {
        setFormData({ ...formData, folder });
        setShowFolderDropdown(false);
    };

    const handleCreateFolder = () => {
        if (newFolderName.trim()) {
            setFormData({ ...formData, folder: newFolderName.trim() });
            setNewFolderName('');
            setIsCreatingFolder(false);
            setShowFolderDropdown(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end lg:items-center justify-center p-0 lg:p-4 z-[100] anim-backdrop"
            onClick={onClose}
        >
            <div
                className="w-full lg:max-w-md max-h-[90vh] overflow-y-auto bg-bg-card rounded-t-3xl lg:rounded-2xl shadow-float border border-white/10 anim-sheet-up lg:anim-pop"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between p-5 border-b border-white/5 sticky top-0 bg-bg-card z-10">
                    <h2 className="text-xl font-bold text-text-primary">
                        {initialData ? 'Edit Bookmark' : 'Add Bookmark'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="w-9 h-9 rounded-full bg-bg-input flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                        aria-label="Close"
                    >
                        <X className="w-5 h-5 text-text-secondary" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-5 space-y-4">
                    <div>
                        <label className="block text-sm font-semibold text-text-secondary mb-2">Title</label>
                        <input
                            ref={titleRef}
                            type="text"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            placeholder="My Bookmark"
                            className="w-full py-3 px-4 rounded-xl bg-bg-input border-2 border-transparent text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary-orange focus:bg-bg-card transition-all"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-text-secondary mb-2">URL</label>
                        <input
                            type="text"
                            value={formData.url}
                            onChange={(e) => {
                                setFormData({ ...formData, url: e.target.value });
                                if (urlError) setUrlError('');
                            }}
                            placeholder="example.com"
                            required
                            className={`w-full py-3 px-4 rounded-xl bg-bg-input border-2 text-text-primary placeholder:text-text-muted focus:outline-none focus:bg-bg-card transition-all ${urlError ? 'border-red-500' : 'border-transparent focus:border-primary-orange'
                                }`}
                        />
                        {urlError && <p className="mt-1.5 text-xs text-red-500">{urlError}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-text-secondary mb-2">Folder</label>
                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => setShowFolderDropdown(!showFolderDropdown)}
                                className="w-full py-3 px-4 rounded-xl bg-bg-input border-2 border-transparent text-left flex items-center justify-between hover:bg-bg-card transition-all"
                            >
                                <span className={formData.folder ? 'text-text-primary' : 'text-text-muted'}>
                                    {formData.folder || 'Select or create folder'}
                                </span>
                                <ChevronDown
                                    className={`w-5 h-5 text-text-muted transition-transform ${showFolderDropdown ? 'rotate-180' : ''}`}
                                />
                            </button>

                            {showFolderDropdown && (
                                <div className="absolute top-full mt-2 left-0 right-0 bg-bg-card rounded-xl shadow-float border border-white/10 z-50 max-h-60 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200">
                                    {isCreatingFolder ? (
                                        <div className="p-3 border-b border-white/5">
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    value={newFolderName}
                                                    onChange={(e) => setNewFolderName(e.target.value)}
                                                    placeholder="New folder name"
                                                    autoFocus
                                                    className="flex-1 py-2 px-3 rounded-lg bg-bg-input text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary-orange"
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') {
                                                            e.preventDefault();
                                                            handleCreateFolder();
                                                        }
                                                    }}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={handleCreateFolder}
                                                    className="px-3 py-2 rounded-lg bg-primary-orange text-white text-sm font-semibold"
                                                >
                                                    Add
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => setIsCreatingFolder(true)}
                                            className="w-full flex items-center gap-3 px-4 py-3 text-left text-primary-orange hover:bg-primary-orange/10 transition-colors border-b border-white/5"
                                        >
                                            <FolderPlus className="w-5 h-5" />
                                            <span className="font-semibold text-sm">Create New Folder</span>
                                        </button>
                                    )}

                                    <button
                                        type="button"
                                        onClick={() => handleSelectFolder('')}
                                        className={`w-full flex items-center justify-between px-4 py-3 text-left hover:bg-bg-input transition-colors ${!formData.folder ? 'bg-bg-input' : ''}`}
                                    >
                                        <span className="text-sm text-text-secondary">No Folder</span>
                                        {!formData.folder && <Check className="w-4 h-4 text-primary-orange" />}
                                    </button>

                                    {availableFolders.map((folder) => (
                                        <button
                                            key={folder}
                                            type="button"
                                            onClick={() => handleSelectFolder(folder)}
                                            className={`w-full flex items-center justify-between px-4 py-3 text-left hover:bg-bg-input transition-colors ${formData.folder === folder ? 'bg-bg-input' : ''}`}
                                        >
                                            <span className="text-sm text-text-primary font-medium">{folder}</span>
                                            {formData.folder === folder && <Check className="w-4 h-4 text-primary-orange" />}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div>
                        <label className="flex items-center gap-1.5 text-sm font-semibold text-text-secondary mb-2">
                            <StickyNote className="w-4 h-4" />
                            Notes <span className="font-normal text-text-muted">(optional)</span>
                        </label>
                        <textarea
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            placeholder="Why this bookmark matters…"
                            rows={2}
                            className="w-full py-3 px-4 rounded-xl bg-bg-input border-2 border-transparent text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary-orange focus:bg-bg-card transition-all resize-none"
                        />
                    </div>

                    <button
                        type="button"
                        onClick={() => setFormData({ ...formData, locked: !formData.locked })}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all ${formData.locked
                            ? 'bg-primary-orange/10 border-primary-orange text-text-primary'
                            : 'bg-bg-input border-transparent text-text-secondary hover:bg-bg-card'
                            }`}
                    >
                        <div
                            className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${formData.locked
                                ? 'bg-primary-orange text-white'
                                : 'bg-bg-card text-text-secondary'
                                }`}
                        >
                            <Lock className="w-4 h-4" />
                        </div>
                        <div className="flex-1 text-left">
                            <div className="text-sm font-semibold">
                                {formData.locked ? 'Locked' : 'Lock this bookmark'}
                            </div>
                            <div className="text-xs text-text-muted">
                                {hasPassword
                                    ? 'Requires password to open'
                                    : 'A password will be set up the first time you lock something'}
                            </div>
                        </div>
                        <div
                            className={`w-10 h-6 rounded-full relative transition-colors ${formData.locked ? 'bg-primary-orange' : 'bg-bg-card'
                                }`}
                        >
                            <div
                                className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${formData.locked ? 'left-[18px]' : 'left-0.5'
                                    }`}
                            />
                        </div>
                    </button>

                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-3 rounded-xl bg-bg-input text-text-primary font-semibold hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-1 py-3 rounded-xl bg-primary-orange text-white font-semibold shadow-orange hover:shadow-lg transition-all"
                        >
                            {initialData ? 'Save' : 'Add Bookmark'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
