export function MobileFilterSection({ activeFilter, setActiveFilter, folders, bookmarksCount }) {
    return (
        <div className="lg:hidden w-full overflow-x-hidden">
            <div className="flex overflow-x-auto gap-2 px-5 pb-4 no-scrollbar snap-x">
                <button
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${activeFilter === 'all'
                        ? 'bg-primary-orange text-white shadow-orange'
                        : 'bg-bg-card text-text-secondary shadow-sm'
                        }`}
                    onClick={() => setActiveFilter('all')}
                >
                    All <span className="opacity-75 text-xs">({bookmarksCount})</span>
                </button>

                {folders.map((folder) => (
                    <button
                        key={folder}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${activeFilter === folder
                            ? 'bg-primary-orange text-white shadow-orange'
                            : 'bg-bg-card text-text-secondary shadow-sm'
                            }`}
                        onClick={() => setActiveFilter(folder)}
                    >
                        {folder}
                    </button>
                ))}
            </div>
        </div>
    );
}
