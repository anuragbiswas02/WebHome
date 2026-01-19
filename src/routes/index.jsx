import { Settings, Image } from 'lucide-react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { useTheme } from '../hooks/useTheme';
import { useBookmarks, parseBookmarkHTML, generateBookmarkHTML } from '../hooks/useBookmarks';
import { useSearchEngines } from '../hooks/useSearchEngines';
// import { parseBookmarkHTML, generateBookmarkHTML } from '../utils/bookmarkUtils';
import { useWallpaper } from '../hooks/useWallpaper';
import { Header } from '../components/Header';
import { SearchSection } from '../components/SearchSection';
import { MobileFilterSection } from '../components/MobileFilterSection';
import { BookmarkGrid } from '../components/BookmarkGrid';
import { RecentBookmarks } from '../components/RecentBookmarks';
import { BottomNav } from '../components/BottomNav';
import { BookmarkModal } from '../components/BookmarkModal';
import { ShortcutModal } from '../components/ShortcutModal';
import { Clock } from '../components/Clock';
import { Stats } from '../components/Stats';

export const Route = createFileRoute('/')({
  component: HomePage,
});

function HomePage() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { bookmarks, shortcuts, addBookmark, updateBookmark, deleteBookmark, importBookmarks, addShortcut, deleteShortcut, updateShortcut } = useBookmarks();
  const { engines, importEngines } = useSearchEngines();
  const { wallpaper, fetchNewWallpaper, loading } = useWallpaper();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBookmark, setEditingBookmark] = useState(null);

  const [isShortcutModalOpen, setIsShortcutModalOpen] = useState(false);
  const [editingShortcut, setEditingShortcut] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedEngineId, setSelectedEngineId] = useState('google');
  const [expandedFolders, setExpandedFolders] = useState({});

  // Username State
  const [username, setUsername] = useState(() => {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem('username') || 'User';
    }
    return 'User';
  });

  useEffect(() => {
    localStorage.setItem('username', username);
  }, [username]);

  // Wallpaper Visibility State
  const [isWallpaperVisible, setIsWallpaperVisible] = useState(() => {
    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem('isWallpaperVisible');
      return stored !== null ? JSON.parse(stored) : true;
    }
    return true;
  });

  useEffect(() => {
    localStorage.setItem('isWallpaperVisible', JSON.stringify(isWallpaperVisible));
  }, [isWallpaperVisible]);

  // Derived State
  const folders = [...new Set(bookmarks.map((b) => b.folder || 'Uncategorized'))];

  const filteredBookmarks = bookmarks.filter((b) => {
    const matchesSearch =
      b.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.url.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (b.folder || '').toLowerCase().includes(searchTerm.toLowerCase());

    if (activeFilter === 'all') return matchesSearch;
    return matchesSearch && (b.folder || 'Uncategorized') === activeFilter;
  });

  const groupedBookmarks = filteredBookmarks.reduce((acc, bookmark) => {
    const folder = bookmark.folder || 'Uncategorized';
    if (!acc[folder]) acc[folder] = [];
    acc[folder].push(bookmark);
    return acc;
  }, {});

  // Handlers
  const toggleFolder = (folder) => {
    setExpandedFolders((prev) => ({
      ...prev,
      [folder]: !prev[folder],
    }));
  };

  const handleImport = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const parsed = parseBookmarkHTML(e.target?.result);
      const incomingEngines = parsed.filter(b => b.folder === 'Search Engines');

      importBookmarks(parsed);
      if (incomingEngines.length > 0) {
        importEngines(incomingEngines.map(e => ({ name: e.title, url: e.url })));
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const handleExport = () => {
    const html = generateBookmarkHTML(bookmarks, shortcuts, engines);
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bookmarks.html';
    a.click();
    URL.revokeObjectURL(url);
  };

  const openAddModal = () => {
    setEditingBookmark(null);
    setIsModalOpen(true);
  };

  const openEditModal = (bookmark) => {
    setEditingBookmark(bookmark);
    setIsModalOpen(true);
  };

  const handleSaveBookmark = (formData) => {
    if (editingBookmark) {
      updateBookmark(editingBookmark.id, formData);
    } else {
      addBookmark(formData);
    }
  };

  const toggleWallpaperVisibility = () => {
    if (!isWallpaperVisible && !wallpaper) {
      // If turning on and no wallpaper set, fetch one
      fetchNewWallpaper();
    }
    setIsWallpaperVisible(!isWallpaperVisible);
  };

  const activeWallpaper = isWallpaperVisible ? wallpaper : null;

  return (
    <div
      className="min-h-screen flex flex-col relative overflow-x-hidden transition-all duration-500 ease-in-out bg-cover bg-center bg-fixed bg-no-repeat"
      style={{
        backgroundImage: activeWallpaper ? `url(${activeWallpaper})` : undefined
      }}
    >
      <div className={`absolute inset-0 z-0 pointer-events-none transition-opacity duration-300 ${activeWallpaper ? 'bg-black/10' : ''}`} />

      {/* Desktop Specific Elements */}
      <Stats
        theme={theme}
        toggleTheme={toggleTheme}
        username={username}
      />

      {/* Desktop Clock Position - Aligned with Stats (Top Right) */}
      <div className="hidden lg:block absolute top-8 right-16 z-20">
        <Clock theme={theme} hasWallpaper={!!activeWallpaper} />
      </div>

      {/* Desktop Bottom Controls (Wallpaper & Settings) */}
      <div className="hidden lg:flex absolute bottom-8 right-12 z-20 gap-3">
        {isWallpaperVisible && (
          <button
            onClick={fetchNewWallpaper}
            className="p-2.5 rounded-xl bg-bg-card/30 backdrop-blur-md text-white border border-white/10 hover:bg-white/20 transition-all shadow-float hover:shadow-lg group"
            title="Shuffle Wallpaper"
          >
            <Image className="w-5 h-5 group-hover:scale-110 transition-transform" />
          </button>
        )}

        <button
          onClick={() => navigate({ to: '/settings' })}
          className="p-2.5 rounded-xl bg-bg-card/30 backdrop-blur-md text-white border border-white/10 hover:bg-white/20 transition-all shadow-float hover:shadow-lg group"
          title="Settings"
        >
          <Settings className="w-5 h-5 group-hover:rotate-90 transition-transform duration-500" />
        </button>
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Header - Repositioned for Desktop to Bottom Right or Minimal */}
        <div className="lg:hidden">
          <Header
            theme={theme}
            toggleTheme={toggleTheme}
            onRefreshWallpaper={fetchNewWallpaper}
            toggleWallpaperVisibility={toggleWallpaperVisibility}
            isWallpaperVisible={isWallpaperVisible}
            username={username}
            onOpenSettings={() => navigate({ to: '/settings' })}
          />
        </div>

        {/* Mobile Clock (Original Position) */}
        <div className="lg:hidden">
          <Clock theme={theme} hasWallpaper={!!activeWallpaper} />
        </div>

        <main className="flex-1 flex flex-col items-center justify-center w-full px-5 lg:px-12 pt-10 pb-20 lg:py-0">

          <div className="w-full max-w-4xl mx-auto space-y-8 lg:space-y-12">
            <SearchSection
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              activeFilter={activeFilter}
              setActiveFilter={setActiveFilter}
              folders={folders}
              bookmarksCount={bookmarks.length}
              selectedEngineId={selectedEngineId}
              setSelectedEngineId={setSelectedEngineId}
              hasWallpaper={!!activeWallpaper}
              shortcuts={shortcuts}
              engines={engines}
              onAddShortcut={() => {
                setEditingShortcut(null);
                setIsShortcutModalOpen(true);
              }}
              onDeleteShortcut={deleteShortcut}
              onEditShortcut={(shortcut) => {
                setEditingShortcut(shortcut);
                setIsShortcutModalOpen(true);
              }}
            />

            <MobileFilterSection
              activeFilter={activeFilter}
              setActiveFilter={setActiveFilter}
              folders={folders}
              bookmarksCount={bookmarks.length}
            />

            <div className="bg-bg-card/30 backdrop-blur-md rounded-3xl p-6 lg:p-8 border border-white/10 shadow-float">
              <BookmarkGrid
                bookmarks={bookmarks}
                groupedBookmarks={groupedBookmarks}
                expandedFolders={expandedFolders}
                toggleFolder={toggleFolder}
                onEdit={openEditModal}
                onDelete={deleteBookmark}
                onAdd={openAddModal}
                onImport={handleImport}
              />
            </div>

            {filteredBookmarks.length > 0 && (
              <RecentBookmarks recentBookmarks={filteredBookmarks.slice(0, 6)} />
            )}
          </div>
        </main>

        <BookmarkModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveBookmark}
          initialData={editingBookmark}
          availableFolders={[...new Set(bookmarks.map((b) => b.folder).filter(Boolean))]}
        />

        <ShortcutModal
          isOpen={isShortcutModalOpen}
          onClose={() => setIsShortcutModalOpen(false)}
          onSave={(data) => {
            if (editingShortcut) {
              updateShortcut(editingShortcut.id, data);
            } else {
              addShortcut(data);
            }
          }}
          initialData={editingShortcut}
        />

      </div>
    </div>
  );
}
