import { createFileRoute, Link } from '@tanstack/react-router';
import { useState } from 'react';
import { User, Save, Upload, Download, ArrowLeft, Moon, Sun, AlertTriangle, Search, Trash2 } from 'lucide-react';
import { useBookmarks } from '../hooks/useBookmarks';
import { useSearchEngines } from '../hooks/useSearchEngines';
import { useTheme } from '../hooks/useTheme';
import { useWallpaper } from '../hooks/useWallpaper';
import { parseBookmarkHTML, generateBookmarkHTML } from '../hooks/useBookmarks';

export const Route = createFileRoute('/settings')({
  component: SettingsPage,
});

function SettingsPage() {
  const { theme, toggleTheme } = useTheme();
  const { bookmarks, shortcuts, importBookmarks, resetBookmarks } = useBookmarks();
  const { engines, addEngine, deleteEngine, importEngines, resetEngines } = useSearchEngines();
  const { wallpaper } = useWallpaper();

  // Local state mirroring HomePage logic
  const [username, setUsername] = useState(() => {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem('username') || 'User';
    }
    return 'User';
  });

  const [tempName, setTempName] = useState(username);

  // New Engine State
  const [newEngine, setNewEngine] = useState({ name: '', url: '' });

  // Sync username to storage
  const handleSaveProfile = (e) => {
    e.preventDefault();
    setUsername(tempName);
    localStorage.setItem('username', tempName);
    alert('Profile saved!');
  };

  const handleImport = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const parsed = parseBookmarkHTML(e.target?.result);

      // Separate Search Engines
      const incomingEngines = parsed.filter(b => b.folder === 'Search Engines');

      importBookmarks(parsed);
      if (incomingEngines.length > 0) {
        importEngines(incomingEngines.map(e => ({ name: e.title, url: e.url })));
      }

      alert(`Successfully imported bookmarks and settings!`);
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

  const handleAddEngine = (e) => {
    e.preventDefault();
    if (newEngine.name && newEngine.url) {
      addEngine(newEngine);
      setNewEngine({ name: '', url: '' });
    }
  };

  return (
    <div
      className="min-h-screen relative overflow-x-hidden transition-all duration-500 ease-in-out bg-cover bg-center bg-fixed bg-no-repeat"
      style={{
        backgroundImage: wallpaper ? `url(${wallpaper})` : undefined,
        backgroundColor: !wallpaper ? 'var(--color-bg-solid)' : undefined
      }}
    >
      <div className={`absolute inset-0 z-0 pointer-events-none transition-opacity duration-300 ${wallpaper ? 'bg-black/40 backdrop-blur-md' : ''}`} />

      <div className="relative z-10 max-w-2xl mx-auto px-6 py-8 text-text-primary">

        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link
            to="/"
            className="p-2 rounded-full bg-bg-card/50 hover:bg-bg-input/80 backdrop-blur-sm transition-colors group shadow-sm"
          >
            <ArrowLeft className="w-6 h-6 text-text-primary group-hover:text-primary-orange" />
          </Link>
          <h1 className="text-2xl font-bold drop-shadow-sm">Settings</h1>
        </div>

        <div className="space-y-6">

          {/* Section: Profile */}
          <div className="bg-bg-card rounded-2xl p-6 shadow-sm border border-gray-100/50">
            <div className="flex items-center gap-2 mb-4 text-primary-orange font-medium text-sm uppercase tracking-wider">
              <User className="w-4 h-4" />
              Profile
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">Display Name</label>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="text"
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-bg-input border border-transparent focus:border-primary-orange focus:bg-bg-card font-medium text-text-primary outline-none transition-all"
                  />
                  <button
                    type="submit"
                    disabled={tempName === username}
                    className="px-5 py-2.5 bg-primary-orange text-white rounded-xl shadow-orange hover:shadow-lg disabled:opacity-50 disabled:shadow-none transition-all flex items-center justify-center gap-2 font-semibold"
                  >
                    <Save className="w-4 h-4" />
                    Save
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* Section: Appearance */}
          <div className="bg-bg-card rounded-2xl p-6 shadow-sm border border-gray-100/50">
            <div className="flex items-center gap-2 mb-4 text-accent-purple font-medium text-sm uppercase tracking-wider">
              <Sun className="w-4 h-4" />
              Appearance
            </div>

            <div className="flex items-center justify-between">
              <span className="text-text-primary font-medium">Theme Mode</span>
              <button
                onClick={toggleTheme}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-bg-input hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                {theme === 'light' ? (
                  <>
                    <Moon className="w-4 h-4" />
                    <span>Dark Mode</span>
                  </>
                ) : (
                  <>
                    <Sun className="w-4 h-4" />
                    <span>Light Mode</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Section: Search Engines */}
          <div className="bg-bg-card rounded-2xl p-6 shadow-sm border border-gray-100/50">
            <div className="flex items-center gap-2 mb-4 text-primary-orange font-medium text-sm uppercase tracking-wider">
              <Search className="w-4 h-4" />
              Search Engines
            </div>

            <div className="space-y-4">
              {/* List Existing */}
              <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                {engines.map(engine => (
                  <div key={engine.id} className="flex items-center justify-between p-3 rounded-xl bg-bg-input">
                    <div className="flex items-center gap-3">
                      {/* Simple Icon Logic for Settings List */}
                      <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center p-1.5 shadow-sm">
                        {/* If safe/default icon exists use it, else generic */}
                        <Search className="w-4 h-4 text-text-secondary" />
                      </div>
                      <div>
                        <div className="font-semibold text-text-primary text-sm">{engine.name}</div>
                        <div className="text-xs text-text-muted truncate max-w-36">{engine.url}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => deleteEngine(engine.id)}
                      className="p-2 text-text-secondary hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete Engine"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add New */}
              <form onSubmit={handleAddEngine} className="pt-4 border-t border-gray-100 dark:border-gray-800">
                <h3 className="text-sm font-semibold mb-3">Add Custom Engine</h3>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="text"
                    placeholder="Name (e.g. Wiki)"
                    value={newEngine.name}
                    onChange={(e) => setNewEngine({ ...newEngine, name: e.target.value })}
                    required
                    className="basis-1/3 grow px-3 py-2.5 rounded-xl bg-bg-input border border-transparent focus:border-primary-orange focus:bg-bg-card text-sm outline-none transition-all"
                  />
                  <input
                    type="text"
                    placeholder="URL (use %s or just suffix)"
                    value={newEngine.url}
                    onChange={(e) => setNewEngine({ ...newEngine, url: e.target.value })}
                    required
                    className="basis-2/3 grow px-3 py-2.5 rounded-xl bg-bg-input border border-transparent focus:border-primary-orange focus:bg-bg-card text-sm outline-none transition-all"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2.5 bg-primary-orange text-white rounded-xl shadow-orange hover:shadow-lg transition-all font-semibold text-sm whitespace-nowrap"
                  >
                    Add
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Section: Data */}
          <div className="bg-bg-card rounded-2xl p-6 shadow-sm border border-gray-100/50">
            <div className="flex items-center gap-2 mb-4 text-accent-teal font-medium text-sm uppercase tracking-wider">
              <Save className="w-4 h-4" />
              Data Management
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="flex items-center gap-4 p-4 rounded-xl bg-bg-input hover:bg-gray-50 dark:hover:bg-gray-800 border-2 border-transparent hover:border-primary-orange/20 cursor-pointer transition-all group">
                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-semibold text-text-primary">Import Bookmarks</div>
                  <div className="text-xs text-text-muted">From HTML file</div>
                </div>
                <input type="file" accept=".html" onChange={handleImport} hidden />
              </label>

              <button
                onClick={handleExport}
                disabled={bookmarks.length === 0}
                className="flex items-center gap-4 p-4 rounded-xl bg-bg-input hover:bg-gray-50 dark:hover:bg-gray-800 border-2 border-transparent hover:border-primary-orange/20 transition-all group disabled:opacity-50 disabled:cursor-not-allowed text-left"
              >
                <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Download className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-semibold text-text-primary">Export Bookmarks</div>
                  <div className="text-xs text-text-muted">To HTML file</div>
                </div>
              </button>
            </div>
          </div>

          {/* Section: Danger Zone */}
          <div className="bg-bg-card rounded-2xl p-6 shadow-sm border border-red-100/50">
            <div className="flex items-center gap-2 mb-4 text-red-500 font-medium text-sm uppercase tracking-wider">
              <AlertTriangle className="w-4 h-4" />
              Danger Zone
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold text-text-primary">Reset All Data</div>
                <div className="text-xs text-text-muted">Clears bookmarks, shortcuts, and custom search engines.</div>
              </div>
              <button
                onClick={() => {
                  if (window.confirm('Are you sure you want to delete all data? This cannot be undone.')) {
                    resetBookmarks();
                    resetEngines();
                    alert('All data has been reset.');
                  }
                }}
                disabled={bookmarks.length === 0}
                className="px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Reset
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
