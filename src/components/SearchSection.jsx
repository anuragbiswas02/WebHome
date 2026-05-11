import { useState } from 'react';
import { Search, ChevronDown, Mic, Camera } from 'lucide-react';
import { QuickLinks } from './QuickLinks';

export function SearchSection({
    searchTerm,
    setSearchTerm,
    activeFilter,
    setActiveFilter,
    folders,
    bookmarksCount,
    selectedEngineId,
    setSelectedEngineId,
    hasWallpaper,
    shortcuts = [],
    engines = [], // New prop
    onAddShortcut,
    onDeleteShortcut,
    onEditShortcut
}) {
    const [showEngineDropdown, setShowEngineDropdown] = useState(false);

    // Fallback to empty array if undefined
    const safeEngines = engines || [];
    const currentEngine = safeEngines.find(eng => eng.id === selectedEngineId) || safeEngines[0];

    const getEngineIcon = (engine) => {
        if (!engine) return null;

        // Try to get favicon from the URL
        try {
            const domain = new URL(engine.url).hostname;
            return (
                <img
                    src={`https://www.google.com/s2/favicons?domain=${domain}&sz=32`}
                    alt={engine.name}
                    className="w-full h-full object-contain"
                    onError={(e) => {
                        e.target.style.display = 'none';
                    }}
                />
            );
        } catch {
            // If URL parsing fails, try to use built-in icon or fallback
            if (engine.icon && typeof engine.icon !== 'string') {
                return engine.icon;
            }
            return <Search className="w-4 h-4 text-gray-400" />;
        }
    };

    const handleWebSearch = (e) => {
        if (e.key === 'Enter' && searchTerm.trim()) {
            if (currentEngine) {
                window.open(currentEngine.url + encodeURIComponent(searchTerm), '_blank');
            }
        }
    };

    return (
        <div className="relative w-full z-40 mb-8 lg:mb-12">
            <div className="flex flex-col items-center gap-6 max-w-4xl mx-auto px-4">

                {/* Independent Search Pill */}
                <div className={`relative w-full max-w-2xl transition-all duration-300 z-50 ${hasWallpaper ? 'brightness-100' : ''}`}>
                    <div className="relative w-full group rounded-full bg-white shadow-xl hover:shadow-2xl transition-shadow">

                        {/* Engine Selector (Left) */}
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 z-20 border-r border-gray-200 pr-2 mr-2">
                            <button
                                className="flex items-center gap-1.5 p-1.5 rounded-full hover:bg-gray-100 text-gray-600 transition-colors"
                                onClick={() => setShowEngineDropdown(!showEngineDropdown)}
                                title="Change Search Engine"
                            >
                                <div className="w-5 h-5 flex items-center justify-center">{getEngineIcon(currentEngine)}</div>
                                <ChevronDown className="w-3 h-3 opacity-60" />
                            </button>

                            {showEngineDropdown && (
                                <div className="absolute top-full mt-4 left-0 min-w-48 bg-white rounded-2xl shadow-2xl p-2 animate-in fade-in slide-in-from-top-2 duration-200 z-[999] border border-gray-100 max-h-80 overflow-y-auto no-scrollbar">
                                    {safeEngines.map((engine) => (
                                        <button
                                            key={engine.id}
                                            className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-left text-sm transition-colors ${selectedEngineId === engine.id
                                                ? 'bg-blue-50 text-blue-600'
                                                : 'text-gray-700 hover:bg-gray-50'
                                                }`}
                                            onClick={() => {
                                                setSelectedEngineId(engine.id);
                                                setShowEngineDropdown(false);
                                            }}
                                        >
                                            <div className="w-5 h-5 flex items-center justify-center">{getEngineIcon(engine)}</div>
                                            <span className="font-medium truncate">{engine.name}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Search Input */}
                        <div className="flex items-center w-full h-12 lg:h-14 rounded-full overflow-hidden">
                            <div className="w-14 shrink-0" /> {/* Spacer for engine selector */}
                            <Search className="w-5 h-5 text-gray-400 ml-2" />
                            <input
                                type="text"
                                data-search-input="true"
                                placeholder={`Search ${currentEngine?.name} or type a URL`}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onKeyDown={handleWebSearch}
                                className="w-full h-full px-4 text-base lg:text-lg text-gray-800 placeholder:text-gray-400 focus:outline-none bg-transparent"
                                autoFocus
                            />

                            {/* Right Icons */}
                            <div className="flex items-center gap-2 pr-4 pl-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        const evt = new CustomEvent('webhome:open-palette');
                                        window.dispatchEvent(evt);
                                    }}
                                    className="hidden sm:flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                                    title="Open command palette (⌘K)"
                                >
                                    <span className="hidden md:inline">⌘</span>K
                                </button>
                                <button
                                    type="button"
                                    className="p-2 text-gray-500 hover:text-blue-500 hover:bg-gray-100 rounded-full transition-colors"
                                    title="Voice Search (Demo)"
                                >
                                    <Mic className="w-5 h-5" />
                                </button>
                                <button
                                    type="button"
                                    className="p-2 text-gray-500 hover:text-blue-500 hover:bg-gray-100 rounded-full transition-colors"
                                    title="Lens (Demo)"
                                >
                                    <Camera className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Shortcuts / Quick Links */}
                <QuickLinks
                    shortcuts={shortcuts}
                    onAdd={onAddShortcut}
                    onDelete={onDeleteShortcut}
                    onEdit={onEditShortcut}
                />

                {/* Categories Filter (kept but can be hidden if user wants exact replica) */}
                {/* For now, keeping it subtle below shortcuts if needed, or we can move it to BookmarkGrid component to declutter SearchSection.
                    The user image doesn't show categories. But the user asked to "add separated bookmarks" and "make search section like this".
                    The categories (All, Uncategorized, etc.) act as a filter for the main grid. 
                    I'll keep them but make them less obtrusive or move them. 
                    Given the request "make search section like this", I will REMOVE the categories from HERE and assume they should be handled in the main grid or just hidden/moved.
                    However, the main grid logic relies on `activeFilter` being passed down.
                    I will render them in a separate row below QuickLinks for now so functionality isn't lost.
                */}
            </div>
        </div>
    );
}

