import { useState, useEffect } from 'react';
import { X, FolderPlus, ChevronDown, Check } from 'lucide-react';

export function BookmarkModal({ isOpen, onClose, onSave, initialData, availableFolders }) {
    const [formData, setFormData] = useState({ title: '', url: '', folder: '' });
    const [showFolderDropdown, setShowFolderDropdown] = useState(false);
    const [isCreatingFolder, setIsCreatingFolder] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setFormData({
                    title: initialData.title,
                    url: initialData.url,
                    folder: initialData.folder || ''
                });
            } else {
                setFormData({ title: '', url: '', folder: '' });
            }
            setShowFolderDropdown(false);
            setIsCreatingFolder(false);
            setNewFolderName('');
        }
    }, [isOpen, initialData]);

    const handleSubmit = (e) => {
        e.preventDefault();
        // Normalize URL
        let url = formData.url.trim();
        if (!/^https?:\/\//i.test(url)) {
            url = 'https://' + url;
        }
        onSave({ ...formData, url });
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
            className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end lg:items-center justify-center p-0 lg:p-4 z-100"
            onClick={onClose}
        >
            <div
                className="w-full lg:max-w-md max-h-[90vh] overflow-y-auto bg-bg-card rounded-t-3xl lg:rounded-2xl shadow-float"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-gray-100/50 sticky top-0 bg-bg-card z-10">
                    <h2 className="text-xl font-bold text-text-primary">
                        {initialData ? 'Edit Bookmark' : 'Add Bookmark'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="w-9 h-9 rounded-full bg-bg-input flex items-center justify-center hover:bg-gray-200 transition-colors"
                    >
                        <X className="w-5 h-5 text-text-secondary" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-5 space-y-5">
                    {/* Title */}
                    <div>
                        <label className="block text-sm font-semibold text-text-secondary mb-2">Title</label>
                        <input
                            type="text"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            placeholder="My Bookmark"
                            required
                            className="w-full py-3 px-4 rounded-xl bg-bg-input border-2 border-transparent text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary-orange focus:bg-bg-card transition-all"
                        />
                    </div>

                    {/* URL */}
                    <div>
                        <label className="block text-sm font-semibold text-text-secondary mb-2">URL</label>
                        <input
                            type="text"
                            value={formData.url}
                            onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                            placeholder="example.com"
                            required
                            className="w-full py-3 px-4 rounded-xl bg-bg-input border-2 border-transparent text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary-orange focus:bg-bg-card transition-all"
                        />
                    </div>

                    {/* Folder Selection */}
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
                                <ChevronDown className={`w-5 h-5 text-text-muted transition-transform ${showFolderDropdown ? 'rotate-180' : ''}`} />
                            </button>

                            {/* Dropdown */}
                            {showFolderDropdown && (
                                <div className="absolute top-full mt-2 left-0 right-0 bg-bg-card rounded-xl shadow-float border border-gray-100/50 z-50 max-h-60 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200">
                                    {/* Create New Folder */}
                                    {isCreatingFolder ? (
                                        <div className="p-3 border-b border-gray-100/50">
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
                                            className="w-full flex items-center gap-3 px-4 py-3 text-left text-primary-orange hover:bg-primary-orange/10 transition-colors border-b border-gray-100/50"
                                        >
                                            <FolderPlus className="w-5 h-5" />
                                            <span className="font-semibold text-sm">Create New Folder</span>
                                        </button>
                                    )}

                                    {/* No Folder Option */}
                                    <button
                                        type="button"
                                        onClick={() => handleSelectFolder('')}
                                        className={`w-full flex items-center justify-between px-4 py-3 text-left hover:bg-bg-input transition-colors ${!formData.folder ? 'bg-bg-input' : ''}`}
                                    >
                                        <span className="text-sm text-text-secondary">No Folder</span>
                                        {!formData.folder && <Check className="w-4 h-4 text-primary-orange" />}
                                    </button>

                                    {/* Existing Folders */}
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

                    {/* Actions */}
                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-3 rounded-xl bg-bg-input text-text-primary font-semibold hover:bg-gray-200 transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-1 py-3 rounded-xl bg-primary-orange text-white font-semibold shadow-orange hover:shadow-lg transition-all"
                        >
                            {initialData ? 'Save Changes' : 'Add Bookmark'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
