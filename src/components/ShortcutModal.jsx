import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

export function ShortcutModal({ isOpen, onClose, onSave, initialData }) {
    const [formData, setFormData] = useState({ title: '', url: '' });

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setFormData({
                    title: initialData.title,
                    url: initialData.url
                });
            } else {
                setFormData({ title: '', url: '' });
            }
        }
    }, [isOpen, initialData]);

    const handleSubmit = (e) => {
        e.preventDefault();

        let url = formData.url.trim();
        if (!/^https?:\/\//i.test(url)) {
            url = 'https://' + url;
        }

        let title = formData.title.trim();
        // Fallback title to hostname if empty
        if (!title) {
            try {
                title = new URL(url).hostname;
            } catch (e) {
                title = 'Shortcut';
            }
        }

        onSave({ title, url });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-[100] backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className="w-full max-w-sm bg-bg-card rounded-2xl shadow-float animate-in fade-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between p-4 border-b border-gray-100/10">
                    <h2 className="text-lg font-semibold text-text-primary">
                        {initialData ? 'Edit Shortcut' : 'Add Shortcut'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-full bg-bg-input flex items-center justify-center hover:bg-text-primary hover:text-white transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-text-secondary mb-1.5 ml-1">Name</label>
                        <input
                            type="text"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            placeholder="Example"
                            className="w-full py-2.5 px-3 rounded-xl bg-bg-input border-2 border-transparent text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary-orange focus:bg-bg-card transition-all"
                            autoFocus
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-text-secondary mb-1.5 ml-1">URL</label>
                        <input
                            type="text"
                            value={formData.url}
                            onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                            placeholder="example.com"
                            required
                            className="w-full py-2.5 px-3 rounded-xl bg-bg-input border-2 border-transparent text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary-orange focus:bg-bg-card transition-all"
                        />
                    </div>

                    <div className="flex gap-2.5 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-2.5 rounded-full bg-bg-input text-sm text-text-primary font-semibold hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-1 py-2.5 rounded-full bg-primary-orange text-sm text-white font-semibold shadow-orange hover:shadow-lg hover:bg-primary-orange-hover transition-all"
                        >
                            {initialData ? 'Save' : 'Add'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
