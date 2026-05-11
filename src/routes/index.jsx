import {
  Settings,
  Image,
  Command,
  Focus,
  Eye,
  EyeOff,
  Plus,
  CheckSquare,
} from 'lucide-react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useTheme } from '../hooks/useTheme';
import {
  useBookmarks,
  parseBookmarkHTML,
  parseBookmarkJSON,
  generateBookmarkHTML,
  generateBookmarkJSON,
} from '../hooks/useBookmarks';
import { useSearchEngines } from '../hooks/useSearchEngines';
import { useWallpaper } from '../hooks/useWallpaper';
import { useToast } from '../hooks/useToast';
import { useFocusMode } from '../hooks/useFocusMode';
import { useAuth } from '../hooks/useAuth';
import { useConfirm } from '../hooks/useConfirm';
import { usePrivacy } from '../hooks/usePrivacy';
import { PasswordSetupModal } from '../components/PasswordModal';
import { Header } from '../components/Header';
import { SearchSection } from '../components/SearchSection';
import { BookmarkGrid } from '../components/BookmarkGrid';
import { PinnedBookmarks } from '../components/PinnedBookmarks';
import { BookmarkModal } from '../components/BookmarkModal';
import { ShortcutModal } from '../components/ShortcutModal';
import { Clock } from '../components/Clock';
import { Stats } from '../components/Stats';
import { CommandPalette } from '../components/CommandPalette';
import { LoginModal } from '../components/LoginModal';
import { SyncIndicator } from '../components/SyncIndicator';
import { BulkActionBar } from '../components/BulkActionBar';

export const Route = createFileRoute('/')({
  component: HomePage,
});

function HomePage() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { user, configured: authConfigured } = useAuth();
  const confirm = useConfirm();
  const privacy = usePrivacy();
  const {
    bookmarks,
    shortcuts,
    mode,
    syncState,
    addBookmark,
    updateBookmark,
    deleteBookmark,
    importBookmarks,
    addShortcut,
    deleteShortcut,
    updateShortcut,
    togglePin,
    recordVisit,
    reorderBookmarks,
    bulkUpdateFolder,
    bulkDelete,
  } = useBookmarks();
  const { engines, importEngines } = useSearchEngines();
  const { wallpaper, fetchNewWallpaper } = useWallpaper();
  const toast = useToast();
  const { focusMode, toggleFocusMode } = useFocusMode();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBookmark, setEditingBookmark] = useState(null);
  const [isShortcutModalOpen, setIsShortcutModalOpen] = useState(false);
  const [editingShortcut, setEditingShortcut] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedEngineId, setSelectedEngineId] = useState('google');
  const [expandedFolders, setExpandedFolders] = useState({});
  const [showFilters, setShowFilters] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [pwSetupOpen, setPwSetupOpen] = useState(false);

  // Bulk select state
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(() => new Set());

  const [username] = useState(() => {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem('username') || 'User';
    }
    return 'User';
  });

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

  // Auto-expand folders on first encounter
  useEffect(() => {
    setExpandedFolders((prev) => {
      const next = { ...prev };
      bookmarks.forEach((b) => {
        const folder = b.folder || 'Uncategorized';
        if (next[folder] === undefined) next[folder] = true;
      });
      return next;
    });
  }, [bookmarks]);

  // Exit select mode when list becomes empty or user navigates
  useEffect(() => {
    if (selectMode && selectedIds.size === 0 && bookmarks.length === 0) {
      setSelectMode(false);
    }
  }, [selectMode, selectedIds, bookmarks.length]);

  // Derived
  const folders = useMemo(
    () => [...new Set(bookmarks.map((b) => b.folder || 'Uncategorized'))],
    [bookmarks],
  );

  const pinnedBookmarks = useMemo(
    () => bookmarks.filter((b) => b.pinned),
    [bookmarks],
  );

  const filteredBookmarks = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return bookmarks.filter((b) => {
      const matchesSearch =
        b.title.toLowerCase().includes(q) ||
        b.url.toLowerCase().includes(q) ||
        (b.folder || '').toLowerCase().includes(q) ||
        (b.notes || '').toLowerCase().includes(q);
      if (activeFilter === 'all') return matchesSearch;
      return matchesSearch && (b.folder || 'Uncategorized') === activeFilter;
    });
  }, [bookmarks, searchTerm, activeFilter]);

  const groupedBookmarks = useMemo(() => {
    return filteredBookmarks.reduce((acc, bookmark) => {
      const folder = bookmark.folder || 'Uncategorized';
      if (!acc[folder]) acc[folder] = [];
      acc[folder].push(bookmark);
      return acc;
    }, {});
  }, [filteredBookmarks]);

  // Handlers
  const toggleFolder = useCallback((folder) => {
    setExpandedFolders((prev) => ({ ...prev, [folder]: !prev[folder] }));
  }, []);

  const openAddModal = useCallback(() => {
    setEditingBookmark(null);
    setIsModalOpen(true);
  }, []);

  const openEditModal = useCallback((bookmark) => {
    setEditingBookmark(bookmark);
    setIsModalOpen(true);
  }, []);

  const handleSaveBookmark = useCallback(
    (formData) => {
      if (editingBookmark) {
        updateBookmark(editingBookmark.id, formData);
        toast.success('Bookmark updated');
      } else {
        addBookmark(formData);
        toast.success('Bookmark added');
      }
    },
    [editingBookmark, updateBookmark, addBookmark, toast],
  );

  const handleDeleteBookmark = useCallback(
    (id) => {
      const removed = bookmarks.find((b) => b.id === id);
      deleteBookmark(id);
      if (removed) {
        toast.info(`Deleted "${removed.title}"`, {
          action: {
            label: 'Undo',
            onClick: () => addBookmark(removed),
          },
        });
      }
    },
    [bookmarks, deleteBookmark, addBookmark, toast],
  );

  const handleTogglePin = useCallback(
    (id) => {
      togglePin(id);
      const bm = bookmarks.find((b) => b.id === id);
      if (bm) toast.info(bm.pinned ? 'Unpinned' : 'Pinned to top');
    },
    [togglePin, bookmarks, toast],
  );

  const handleImport = useCallback(
    (event) => {
      const file = event.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result;
        const isJson = file.name.toLowerCase().endsWith('.json');
        if (isJson) {
          const parsed = parseBookmarkJSON(content);
          if (!parsed) {
            toast.error('Invalid JSON file');
            return;
          }
          const res = importBookmarks(parsed.bookmarks);
          if (parsed.searchEngines?.length) importEngines(parsed.searchEngines);
          toast.success(
            `Imported ${res.bookmarksAdded} bookmark${res.bookmarksAdded === 1 ? '' : 's'}`,
          );
        } else {
          const parsed = parseBookmarkHTML(content);
          const incomingEngines = parsed.filter((b) => b.folder === 'Search Engines');
          const res = importBookmarks(parsed);
          if (incomingEngines.length > 0) {
            importEngines(incomingEngines.map((e) => ({ name: e.title, url: e.url })));
          }
          toast.success(
            `Imported ${res.bookmarksAdded} bookmark${res.bookmarksAdded === 1 ? '' : 's'}`,
          );
        }
      };
      reader.readAsText(file);
      event.target.value = '';
    },
    [importBookmarks, importEngines, toast],
  );

  const toggleWallpaperVisibility = useCallback(() => {
    if (!isWallpaperVisible && !wallpaper) fetchNewWallpaper();
    setIsWallpaperVisible((v) => !v);
  }, [isWallpaperVisible, wallpaper, fetchNewWallpaper]);

  const handleExportHTML = useCallback(() => {
    const html = generateBookmarkHTML(bookmarks, shortcuts, engines);
    downloadBlob(html, 'webhome-bookmarks.html', 'text/html');
    toast.success('Exported — import into Chrome via Bookmarks → Import');
  }, [bookmarks, shortcuts, engines, toast]);

  const handleExportJSON = useCallback(() => {
    const json = generateBookmarkJSON(bookmarks, shortcuts, engines);
    downloadBlob(json, 'webhome-backup.json', 'application/json');
    toast.success('JSON backup exported');
  }, [bookmarks, shortcuts, engines, toast]);

  // Listen for requests from deep-nested UI (e.g. "lock folder" menu) that need
  // the user to set up a password first.
  useEffect(() => {
    const onSetup = () => setPwSetupOpen(true);
    window.addEventListener('webhome:setup-password', onSetup);
    return () => window.removeEventListener('webhome:setup-password', onSetup);
  }, []);

  // Bulk select handlers
  const toggleSelectMode = useCallback(() => {
    setSelectMode((v) => {
      if (v) setSelectedIds(new Set());
      return !v;
    });
  }, []);

  const toggleSelectId = useCallback((id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const selectFolder = useCallback(
    (folder, select) => {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        const items = groupedBookmarks[folder] || [];
        items.forEach((b) => {
          if (select) next.add(b.id);
          else next.delete(b.id);
        });
        return next;
      });
    },
    [groupedBookmarks],
  );

  const bulkMove = useCallback(
    (folder) => {
      const ids = Array.from(selectedIds);
      if (ids.length === 0) return;
      bulkUpdateFolder(ids, folder);
      toast.success(
        `Moved ${ids.length} bookmark${ids.length === 1 ? '' : 's'} to "${folder || 'Uncategorized'}"`,
      );
      setSelectedIds(new Set());
      setSelectMode(false);
    },
    [selectedIds, bulkUpdateFolder, toast],
  );

  const bulkTogglePinAction = useCallback(() => {
    // Pin if any are unpinned; otherwise unpin all
    const ids = Array.from(selectedIds);
    const anyUnpinned = bookmarks.some((b) => ids.includes(b.id) && !b.pinned);
    ids.forEach((id) => {
      const bm = bookmarks.find((b) => b.id === id);
      if (!bm) return;
      if (anyUnpinned ? !bm.pinned : bm.pinned) {
        togglePin(id);
      }
    });
    toast.info(anyUnpinned ? `Pinned ${ids.length}` : `Unpinned ${ids.length}`);
  }, [selectedIds, bookmarks, togglePin, toast]);

  const bulkDeleteAction = useCallback(async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    const ok = await confirm({
      title: `Delete ${ids.length} bookmark${ids.length === 1 ? '' : 's'}?`,
      description: 'This cannot be undone.',
      confirmLabel: 'Delete',
      destructive: true,
    });
    if (!ok) return;
    bulkDelete(ids);
    toast.success(`Deleted ${ids.length}`);
    setSelectedIds(new Set());
    setSelectMode(false);
  }, [selectedIds, bulkDelete, confirm, toast]);

  const activeWallpaper = isWallpaperVisible ? wallpaper : null;

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e) => {
      const isMod = e.metaKey || e.ctrlKey;
      const target = e.target;
      const inField =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable);

      if (isMod && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen((v) => !v);
        return;
      }
      if (isMod && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        openAddModal();
        return;
      }
      if (isMod && e.key === '/') {
        e.preventDefault();
        document.querySelector('input[data-search-input="true"]')?.focus();
        return;
      }
      if (!inField) {
        if (e.key === '/') {
          e.preventDefault();
          document.querySelector('input[data-search-input="true"]')?.focus();
        } else if (e.key.toLowerCase() === 'f') {
          toggleFocusMode();
        } else if (e.key.toLowerCase() === 't') {
          toggleTheme();
        } else if (e.key.toLowerCase() === 'w') {
          fetchNewWallpaper();
        } else if (e.key === 'Escape' && selectMode) {
          setSelectMode(false);
          setSelectedIds(new Set());
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [openAddModal, toggleFocusMode, toggleTheme, fetchNewWallpaper, selectMode]);

  useEffect(() => {
    const onOpen = () => setPaletteOpen(true);
    window.addEventListener('webhome:open-palette', onOpen);
    return () => window.removeEventListener('webhome:open-palette', onOpen);
  }, []);

  const syncBadge = (
    <SyncIndicator
      mode={mode}
      syncState={syncState}
      onClick={() => {
        if (mode === 'cloud') navigate({ to: '/settings' });
        else if (authConfigured) setLoginOpen(true);
        else navigate({ to: '/settings' });
      }}
    />
  );

  return (
    <div
      className="min-h-screen flex flex-col relative overflow-x-hidden transition-all duration-500 ease-in-out bg-cover bg-center bg-fixed bg-no-repeat"
      style={{
        backgroundImage: activeWallpaper ? `url(${activeWallpaper})` : undefined,
      }}
    >
      <div
        className={`absolute inset-0 z-0 pointer-events-none transition-opacity duration-300 ${activeWallpaper ? 'bg-black/10' : ''
          }`}
      />

      {/* Desktop Stats */}
      {!focusMode && (
        <div className="anim-slide-down">
          <Stats
            theme={theme}
            toggleTheme={toggleTheme}
            username={user?.email?.split('@')[0] || username}
            bookmarksCount={bookmarks.length}
          />
        </div>
      )}

      {/* Desktop Clock */}
      {!focusMode && (
        <div className="hidden lg:block absolute top-8 right-16 z-20 anim-slide-down">
          <Clock theme={theme} hasWallpaper={!!activeWallpaper} />
        </div>
      )}

      {/* Desktop Top-right Sync */}
      {!focusMode && (
        <div className="hidden lg:flex absolute top-8 right-8 z-20 items-center gap-2 anim-fade-in">
          <SyncIndicator
            mode={mode}
            syncState={syncState}
            onClick={() => {
              if (mode === 'cloud') navigate({ to: '/settings' });
              else if (authConfigured) setLoginOpen(true);
              else navigate({ to: '/settings' });
            }}
          />
        </div>
      )}

      {/* Desktop Bottom Controls */}
      <div className="hidden lg:flex absolute bottom-8 right-12 z-20 gap-2.5 anim-fade-in anim-delay-3">
        <button
          onClick={() => setPaletteOpen(true)}
          className="flex items-center gap-1.5 pl-3 pr-2 py-2 rounded-xl bg-bg-card/30 backdrop-blur-md text-white border border-white/10 hover:bg-white/20 transition-all shadow-float hover:shadow-lg"
          title="Command palette (⌘K)"
        >
          <Command className="w-4 h-4" />
          <span className="text-xs font-semibold">K</span>
        </button>

        <button
          onClick={toggleSelectMode}
          className={`p-2.5 rounded-xl backdrop-blur-md border transition-all shadow-float hover:shadow-lg ${selectMode
            ? 'bg-primary-orange text-white border-primary-orange shadow-orange'
            : 'bg-bg-card/30 text-white border-white/10 hover:bg-white/20'
            }`}
          title={selectMode ? 'Exit select mode' : 'Select / group'}
        >
          <CheckSquare className="w-5 h-5" />
        </button>

        <button
          onClick={toggleFocusMode}
          className={`p-2.5 rounded-xl backdrop-blur-md border transition-all shadow-float hover:shadow-lg ${focusMode
            ? 'bg-primary-orange text-white border-primary-orange shadow-orange'
            : 'bg-bg-card/30 text-white border-white/10 hover:bg-white/20'
            }`}
          title={focusMode ? 'Exit focus mode (F)' : 'Focus mode (F)'}
        >
          {focusMode ? <EyeOff className="w-5 h-5" /> : <Focus className="w-5 h-5" />}
        </button>

        {isWallpaperVisible && (
          <button
            onClick={fetchNewWallpaper}
            className="p-2.5 rounded-xl bg-bg-card/30 backdrop-blur-md text-white border border-white/10 hover:bg-white/20 transition-all shadow-float hover:shadow-lg group"
            title="Shuffle wallpaper (W)"
          >
            <Image className="w-5 h-5 group-hover:scale-110 transition-transform" />
          </button>
        )}

        <button
          onClick={toggleWallpaperVisibility}
          className="p-2.5 rounded-xl bg-bg-card/30 backdrop-blur-md text-white border border-white/10 hover:bg-white/20 transition-all shadow-float hover:shadow-lg"
          title={isWallpaperVisible ? 'Hide wallpaper' : 'Show wallpaper'}
        >
          {isWallpaperVisible ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
        </button>

        <button
          onClick={() => navigate({ to: '/settings' })}
          className="p-2.5 rounded-xl bg-bg-card/30 backdrop-blur-md text-white border border-white/10 hover:bg-white/20 transition-all shadow-float hover:shadow-lg group"
          title="Settings"
        >
          <Settings className="w-5 h-5 group-hover:rotate-90 transition-transform duration-500" />
        </button>
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Mobile Header */}
        {!focusMode && (
          <div className="lg:hidden">
            <Header
              theme={theme}
              toggleTheme={toggleTheme}
              onRefreshWallpaper={fetchNewWallpaper}
              toggleWallpaperVisibility={toggleWallpaperVisibility}
              isWallpaperVisible={isWallpaperVisible}
              onOpenSettings={() => navigate({ to: '/settings' })}
              onOpenPalette={() => setPaletteOpen(true)}
              onToggleFocus={toggleFocusMode}
              focusMode={focusMode}
              onToggleSelect={toggleSelectMode}
              syncBadge={syncBadge}
            />
          </div>
        )}

        {/* Exit Focus button — visible only while focus mode is active */}
        {focusMode && (
          <button
            onClick={toggleFocusMode}
            className="fixed top-[max(env(safe-area-inset-top),1rem)] right-4 lg:top-8 lg:right-12 z-[60] flex items-center gap-1.5 pl-3 pr-3.5 py-2 rounded-full bg-bg-card/40 backdrop-blur-md text-white border border-white/20 hover:bg-white/20 shadow-float transition-all anim-slide-down"
            aria-label="Exit focus mode"
          >
            <EyeOff className="w-4 h-4" />
            <span className="text-xs font-semibold">Exit focus</span>
          </button>
        )}

        {/* Mobile Clock */}
        {!focusMode && (
          <div className="lg:hidden">
            <Clock theme={theme} hasWallpaper={!!activeWallpaper} />
          </div>
        )}

        <main
          className="flex-1 flex flex-col items-center justify-center w-full px-4 lg:px-12 pt-6 lg:pt-10 pb-[calc(env(safe-area-inset-bottom,0)+6rem)] lg:py-0"
        >
          <div className="w-full max-w-4xl mx-auto space-y-5 lg:space-y-8">
            {focusMode && (
              <div className="flex flex-col items-center pt-4">
                <Clock theme={theme} hasWallpaper={!!activeWallpaper} />
              </div>
            )}

            <div className="anim-slide-up anim-delay-1">
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
                shortcuts={focusMode ? [] : shortcuts}
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
            </div>

            {!focusMode && (
              <>
                {pinnedBookmarks.length > 0 && (
                  <div className="anim-slide-up anim-delay-2">
                    <PinnedBookmarks
                      pinned={pinnedBookmarks}
                      onRecordVisit={recordVisit}
                      onTogglePin={handleTogglePin}
                    />
                  </div>
                )}

                <div className="bg-bg-card/30 backdrop-blur-md rounded-3xl p-4 lg:p-8 border border-white/10 shadow-float anim-slide-up anim-delay-3">
                  <div className="flex items-center justify-between mb-4 gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <h2 className="text-lg lg:text-xl font-bold text-text-primary">Bookmarks</h2>
                      <span className="px-2.5 py-0.5 rounded-full bg-primary-orange/20 text-primary-orange text-xs font-semibold">
                        {bookmarks.length}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={toggleSelectMode}
                        className={`p-2 rounded-xl transition-all lg:hidden ${selectMode
                          ? 'bg-primary-orange text-white'
                          : 'bg-bg-input text-text-secondary hover:bg-bg-card'
                          }`}
                        title="Select"
                      >
                        <CheckSquare className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`p-2 rounded-xl transition-all ${showFilters
                          ? 'bg-primary-orange text-white'
                          : 'bg-bg-input text-text-secondary hover:bg-bg-card'
                          }`}
                        title={showFilters ? 'Hide Filters' : 'Show Filters'}
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                          />
                        </svg>
                      </button>
                      <button
                        onClick={openAddModal}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary-orange text-white text-sm font-semibold shadow-orange hover:shadow-lg transition-all"
                      >
                        <Plus className="w-4 h-4" />
                        <span className="hidden sm:inline">Add</span>
                      </button>
                    </div>
                  </div>

                  {showFilters && (
                    <div className="flex overflow-x-auto gap-2 pb-4 no-scrollbar snap-x animate-in fade-in slide-in-from-top-2 duration-200">
                      <button
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all shrink-0 ${activeFilter === 'all'
                          ? 'bg-primary-orange text-white shadow-orange'
                          : 'bg-bg-card text-text-secondary shadow-sm hover:bg-bg-input'
                          }`}
                        onClick={() => setActiveFilter('all')}
                      >
                        All <span className="opacity-75 text-xs">({bookmarks.length})</span>
                      </button>
                      {folders.map((folder) => (
                        <button
                          key={folder}
                          className={`px-4 py-2 rounded-full text-sm font-medium transition-all shrink-0 ${activeFilter === folder
                            ? 'bg-primary-orange text-white shadow-orange'
                            : 'bg-bg-card text-text-secondary shadow-sm hover:bg-bg-input'
                            }`}
                          onClick={() => setActiveFilter(folder)}
                        >
                          {folder}
                        </button>
                      ))}
                    </div>
                  )}

                  <BookmarkGrid
                    bookmarks={bookmarks}
                    groupedBookmarks={groupedBookmarks}
                    expandedFolders={expandedFolders}
                    toggleFolder={toggleFolder}
                    onEdit={openEditModal}
                    onDelete={handleDeleteBookmark}
                    onAdd={openAddModal}
                    onImport={handleImport}
                    onTogglePin={handleTogglePin}
                    onRecordVisit={recordVisit}
                    onReorder={reorderBookmarks}
                    selectMode={selectMode}
                    selectedIds={selectedIds}
                    onToggleSelect={toggleSelectId}
                    onSelectFolder={selectFolder}
                  />

                  {searchTerm && filteredBookmarks.length === 0 && bookmarks.length > 0 && (
                    <div className="text-center py-8 text-text-muted text-sm">
                      No bookmarks match "<span className="text-text-primary font-medium">{searchTerm}</span>"
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </main>

        {/* Mobile FAB — Add Bookmark */}
        {!focusMode && !selectMode && (
          <button
            onClick={openAddModal}
            className="lg:hidden fixed right-4 bottom-[calc(env(safe-area-inset-bottom,0)+1rem)] z-40 w-14 h-14 rounded-full bg-primary-orange text-white shadow-orange flex items-center justify-center hover:scale-105 active:scale-95 transition-transform anim-pop anim-delay-4"
            aria-label="Add bookmark"
          >
            <Plus className="w-6 h-6" strokeWidth={2.5} />
          </button>
        )}

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
              toast.success('Shortcut updated');
            } else {
              addShortcut(data);
              toast.success('Shortcut added');
            }
          }}
          initialData={editingShortcut}
        />

        <CommandPalette
          isOpen={paletteOpen}
          onClose={() => setPaletteOpen(false)}
          bookmarks={privacy.canShowLocked ? bookmarks : bookmarks.filter((b) => !privacy.isBookmarkLocked(b))}
          shortcuts={shortcuts}
          engines={engines}
          onOpenBookmark={(bm) => recordVisit(bm.id)}
          onNavigateSettings={() => navigate({ to: '/settings' })}
          onAddBookmark={openAddModal}
          onToggleTheme={toggleTheme}
          onShuffleWallpaper={fetchNewWallpaper}
          onToggleFocus={toggleFocusMode}
          onExportHTML={handleExportHTML}
          onExportJSON={handleExportJSON}
          onRelock={() => {
            privacy.relock();
            toast.info('Locked');
          }}
          canRelock={privacy.hasPassword && privacy.unlocked}
          focusActive={focusMode}
          theme={theme}
        />

        <LoginModal isOpen={loginOpen} onClose={() => setLoginOpen(false)} />
        <PasswordSetupModal
          isOpen={pwSetupOpen}
          onClose={() => setPwSetupOpen(false)}
          mode="setup"
        />

        {selectMode && (
          <BulkActionBar
            selectedCount={selectedIds.size}
            onCancel={() => {
              setSelectMode(false);
              setSelectedIds(new Set());
            }}
            onMove={bulkMove}
            onDelete={bulkDeleteAction}
            onTogglePin={bulkTogglePinAction}
            availableFolders={folders}
          />
        )}
      </div>
    </div>
  );
}

function downloadBlob(content, filename, mime) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
