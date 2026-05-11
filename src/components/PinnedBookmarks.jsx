import { Pin, ExternalLink } from 'lucide-react';

const getFavicon = (url) => {
    try {
        const domain = new URL(url).hostname;
        return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
    } catch {
        return null;
    }
};

const getDomain = (url) => {
    try {
        return new URL(url).hostname.replace('www.', '');
    } catch {
        return url;
    }
};

export function PinnedBookmarks({ pinned, onRecordVisit, onTogglePin }) {
    if (!pinned || pinned.length === 0) return null;

    return (
        <div className="bg-bg-card/30 backdrop-blur-md rounded-3xl p-5 lg:p-6 border border-white/10 shadow-float">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <Pin className="w-4 h-4 text-primary-orange fill-current" />
                    <h2 className="text-base lg:text-lg font-bold text-text-primary">Pinned</h2>
                    <span className="px-2 py-0.5 rounded-full bg-primary-orange/20 text-primary-orange text-xs font-semibold">
                        {pinned.length}
                    </span>
                </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 lg:gap-3">
                {pinned.map((bookmark) => {
                    const fav = getFavicon(bookmark.url);
                    return (
                        <a
                            key={bookmark.id}
                            href={bookmark.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => onRecordVisit?.(bookmark.id)}
                            className="group relative flex items-center gap-2.5 p-2.5 rounded-xl bg-bg-input/60 hover:bg-bg-input border border-white/5 hover:border-primary-orange/30 transition-all hover:-translate-y-0.5 hover:shadow-lg"
                            title={bookmark.notes || `${bookmark.title} — ${getDomain(bookmark.url)}`}
                        >
                            <div className="w-7 h-7 rounded-lg bg-bg-card flex items-center justify-center overflow-hidden shrink-0">
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
                                    <span className="text-xs">🔗</span>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="text-xs font-semibold text-text-primary truncate">
                                    {bookmark.title}
                                </div>
                                <div className="text-[10px] text-text-muted truncate">
                                    {getDomain(bookmark.url)}
                                </div>
                            </div>
                            <ExternalLink className="w-3 h-3 text-text-muted opacity-0 group-hover:opacity-60 transition-opacity" />
                        </a>
                    );
                })}
            </div>
        </div>
    );
}
