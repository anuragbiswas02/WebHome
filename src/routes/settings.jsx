import { createFileRoute, Link } from '@tanstack/react-router';
import { useState } from 'react';
import {
    User,
    Save,
    Upload,
    Download,
    ArrowLeft,
    Moon,
    Sun,
    AlertTriangle,
    Search,
    Trash2,
    Cloud,
    LogIn,
    LogOut,
    FileJson,
    FileText,
    Lock,
    LockOpen,
    Folder,
    KeyRound,
    ShieldOff,
} from 'lucide-react';
import {
    useBookmarks,
    parseBookmarkHTML,
    parseBookmarkJSON,
    generateBookmarkHTML,
    generateBookmarkJSON,
} from '../hooks/useBookmarks';
import { useSearchEngines } from '../hooks/useSearchEngines';
import { useTheme } from '../hooks/useTheme';
import { useWallpaper } from '../hooks/useWallpaper';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { useConfirm } from '../hooks/useConfirm';
import { usePrivacy } from '../hooks/usePrivacy';
import { LoginModal } from '../components/LoginModal';
import { SyncIndicator } from '../components/SyncIndicator';
import { PasswordSetupModal } from '../components/PasswordModal';

export const Route = createFileRoute('/settings')({
    component: SettingsPage,
});

function SettingsPage() {
    const { theme, toggleTheme } = useTheme();
    const {
        bookmarks,
        shortcuts,
        mode,
        syncState,
        importBookmarks,
        resetBookmarks,
    } = useBookmarks();
    const { engines, addEngine, deleteEngine, importEngines, resetEngines } = useSearchEngines();
    const { wallpaper } = useWallpaper();
    const { user, configured: authConfigured, signOut } = useAuth();
    const toast = useToast();
    const confirm = useConfirm();
    const privacy = usePrivacy();

    const [username, setUsername] = useState(() => {
        if (typeof localStorage !== 'undefined') {
            return localStorage.getItem('username') || 'User';
        }
        return 'User';
    });
    const [tempName, setTempName] = useState(username);
    const [newEngine, setNewEngine] = useState({ name: '', url: '' });
    const [loginOpen, setLoginOpen] = useState(false);
    const [pwSetupOpen, setPwSetupOpen] = useState(false);
    const [pwSetupMode, setPwSetupMode] = useState('setup');

    const handleSaveProfile = (e) => {
        e.preventDefault();
        setUsername(tempName);
        localStorage.setItem('username', tempName);
        toast.success('Profile saved');
    };

    const handleImport = (event) => {
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
                toast.success(`Imported ${res.bookmarksAdded} bookmarks`);
            } else {
                const parsed = parseBookmarkHTML(content);
                const incomingEngines = parsed.filter((b) => b.folder === 'Search Engines');
                const res = importBookmarks(parsed);
                if (incomingEngines.length > 0) {
                    importEngines(incomingEngines.map((e) => ({ name: e.title, url: e.url })));
                }
                toast.success(`Imported ${res.bookmarksAdded} bookmarks`);
            }
        };
        reader.readAsText(file);
        event.target.value = '';
    };

    const handleExportHTML = () => {
        const html = generateBookmarkHTML(bookmarks, shortcuts, engines);
        downloadFile(html, 'bookmarks.html', 'text/html');
        toast.success('Exported as HTML');
    };

    const handleExportJSON = () => {
        const json = generateBookmarkJSON(bookmarks, shortcuts, engines);
        downloadFile(json, 'webhome-backup.json', 'application/json');
        toast.success('Exported as JSON');
    };

    const handleAddEngine = (e) => {
        e.preventDefault();
        if (newEngine.name && newEngine.url) {
            addEngine(newEngine);
            setNewEngine({ name: '', url: '' });
            toast.success('Engine added');
        }
    };

    const handleReset = async () => {
        const ok = await confirm({
            title: 'Reset all data?',
            description: 'All bookmarks, shortcuts, and custom search engines will be deleted. This cannot be undone.',
            confirmLabel: 'Delete everything',
            destructive: true,
        });
        if (!ok) return;
        resetBookmarks();
        resetEngines();
        toast.success('All data has been reset');
    };

    const handleSignOut = async () => {
        const ok = await confirm({
            title: 'Sign out?',
            description: 'Your cloud data will stay safe. You can sign back in anytime. Your local cache will remain on this device.',
            confirmLabel: 'Sign out',
        });
        if (!ok) return;
        await signOut();
        toast.info('Signed out — now using local-only mode');
    };

    const allFolders = [
        ...new Set(bookmarks.map((b) => b.folder || 'Uncategorized')),
    ];

    const toggleFolderLock = async (folder) => {
        if (privacy.isFolderLocked(folder)) {
            const ok = await privacy.requireUnlock({ reason: `Unlock "${folder}"` });
            if (!ok) return;
            privacy.unlockFolderPersistent(folder);
            toast.info(`Unlocked "${folder}"`);
        } else {
            if (!privacy.hasPassword) {
                setPwSetupMode('setup');
                setPwSetupOpen(true);
                // User needs to set password first; they can retry after.
                return;
            }
            privacy.lockFolder(folder);
            toast.success(`Locked "${folder}"`);
        }
    };

    const handleRemovePassword = async () => {
        const ok = await confirm({
            title: 'Remove password?',
            description: 'All locked bookmarks and folders will become unlocked.',
            confirmLabel: 'Remove',
            destructive: true,
        });
        if (!ok) return;
        const input = window.prompt('Enter current password to remove:');
        if (!input) return;
        const success = await privacy.removePassword(input);
        if (success) {
            toast.success('Password removed — all locks cleared');
        } else {
            toast.error('Incorrect password');
        }
    };

    return (
        <div
            className="min-h-screen relative overflow-x-hidden transition-all duration-500 ease-in-out bg-cover bg-center bg-fixed bg-no-repeat"
            style={{
                backgroundImage: wallpaper ? `url(${wallpaper})` : undefined,
                backgroundColor: !wallpaper ? 'var(--color-bg-solid)' : undefined,
            }}
        >
            <div
                className={`absolute inset-0 z-0 pointer-events-none transition-opacity duration-300 ${wallpaper ? 'bg-black/40 backdrop-blur-md' : ''
                    }`}
            />

            <div className="relative z-10 max-w-2xl mx-auto px-4 lg:px-6 pt-[max(env(safe-area-inset-top),1.5rem)] pb-[calc(env(safe-area-inset-bottom,0)+2rem)] text-text-primary">
                <div className="flex items-center justify-between gap-3 mb-6 anim-slide-down">
                    <div className="flex items-center gap-3 min-w-0">
                        <Link
                            to="/"
                            className="p-2 rounded-full bg-bg-card/50 hover:bg-bg-input/80 backdrop-blur-sm transition-colors group shadow-sm border border-white/10"
                        >
                            <ArrowLeft className="w-5 h-5 text-text-primary group-hover:text-primary-orange" />
                        </Link>
                        <h1 className="text-2xl font-bold drop-shadow-sm truncate">Settings</h1>
                    </div>
                    <SyncIndicator mode={mode} syncState={syncState} onClick={() => { }} />
                </div>

                <div className="space-y-5 anim-slide-up anim-delay-1">
                    {/* Account / Sync */}
                    <Section icon={<Cloud className="w-4 h-4" />} title="Account & Sync" accent="text-primary-orange">
                        {user ? (
                            <div>
                                <div className="flex items-center gap-3 p-3 rounded-xl bg-bg-input">
                                    <div className="w-10 h-10 rounded-full bg-primary-orange/15 text-primary-orange flex items-center justify-center font-bold">
                                        {(user.email || '?').slice(0, 1).toUpperCase()}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="text-sm font-semibold text-text-primary truncate">
                                            {user.email}
                                        </div>
                                        <div className="text-xs text-text-muted">
                                            {syncState === 'synced' && 'Synced with Firebase'}
                                            {syncState === 'syncing' && 'Syncing…'}
                                            {syncState === 'error' && 'Sync error — still saving locally'}
                                            {syncState === 'local' && 'Connecting…'}
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={handleSignOut}
                                    className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-bg-input text-text-primary font-semibold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                                >
                                    <LogOut className="w-4 h-4" />
                                    Sign out
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <p className="text-sm text-text-secondary leading-relaxed">
                                    Without signing in, your bookmarks stay only on this device.
                                    Sign in to sync them with Firebase and access the same bookmarks on your phone, tablet, and laptop.
                                </p>
                                <button
                                    onClick={() => setLoginOpen(true)}
                                    disabled={!authConfigured}
                                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary-orange text-white font-semibold shadow-orange hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <LogIn className="w-4 h-4" />
                                    {authConfigured ? 'Sign in to sync' : 'Sync not configured'}
                                </button>
                                {!authConfigured && (
                                    <p className="text-xs text-text-muted">
                                        Set Firebase env vars (<code className="bg-bg-input px-1 py-0.5 rounded">VITE_FIREBASE_*</code>) to enable cloud sync.
                                    </p>
                                )}
                            </div>
                        )}
                    </Section>

                    {/* Profile */}
                    <Section icon={<User className="w-4 h-4" />} title="Profile" accent="text-primary-orange">
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
                    </Section>

                    {/* Appearance */}
                    <Section icon={<Sun className="w-4 h-4" />} title="Appearance" accent="text-accent-purple">
                        <div className="flex items-center justify-between">
                            <span className="text-text-primary font-medium">Theme</span>
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
                    </Section>

                    {/* Search Engines */}
                    <Section icon={<Search className="w-4 h-4" />} title="Search Engines" accent="text-primary-orange">
                        <div className="space-y-4">
                            <div className="space-y-2 max-h-60 overflow-y-auto pr-1 no-scrollbar">
                                {engines.map((engine) => (
                                    <div key={engine.id} className="flex items-center justify-between p-3 rounded-xl bg-bg-input">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="w-8 h-8 rounded-full bg-bg-card flex items-center justify-center p-1.5 shadow-sm shrink-0">
                                                <Search className="w-4 h-4 text-text-secondary" />
                                            </div>
                                            <div className="min-w-0">
                                                <div className="font-semibold text-text-primary text-sm truncate">{engine.name}</div>
                                                <div className="text-xs text-text-muted truncate">{engine.url}</div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => {
                                                deleteEngine(engine.id);
                                                toast.info(`Removed ${engine.name}`);
                                            }}
                                            className="p-2 text-text-secondary hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors shrink-0"
                                            title="Delete"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>

                            <form onSubmit={handleAddEngine} className="pt-4 border-t border-white/5">
                                <h3 className="text-sm font-semibold mb-3">Add Custom Engine</h3>
                                <div className="flex flex-col sm:flex-row gap-3">
                                    <input
                                        type="text"
                                        placeholder="Name (e.g. Wiki)"
                                        value={newEngine.name}
                                        onChange={(e) => setNewEngine({ ...newEngine, name: e.target.value })}
                                        required
                                        className="sm:basis-1/3 grow px-3 py-2.5 rounded-xl bg-bg-input border border-transparent focus:border-primary-orange focus:bg-bg-card text-sm outline-none transition-all"
                                    />
                                    <input
                                        type="text"
                                        placeholder="URL (with query suffix)"
                                        value={newEngine.url}
                                        onChange={(e) => setNewEngine({ ...newEngine, url: e.target.value })}
                                        required
                                        className="sm:basis-2/3 grow px-3 py-2.5 rounded-xl bg-bg-input border border-transparent focus:border-primary-orange focus:bg-bg-card text-sm outline-none transition-all"
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
                    </Section>

                    {/* Data */}
                    <Section icon={<Save className="w-4 h-4" />} title="Data Management" accent="text-accent-teal">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <label className="flex items-center gap-3 p-3.5 rounded-xl bg-bg-input hover:bg-bg-card border-2 border-transparent hover:border-primary-orange/30 cursor-pointer transition-all group">
                                <div className="w-10 h-10 rounded-full bg-blue-500/15 text-blue-500 flex items-center justify-center group-hover:scale-110 transition-transform shrink-0">
                                    <Upload className="w-5 h-5" />
                                </div>
                                <div className="min-w-0">
                                    <div className="font-semibold text-text-primary">Import</div>
                                    <div className="text-xs text-text-muted">HTML or JSON file</div>
                                </div>
                                <input type="file" accept=".html,.json" onChange={handleImport} hidden />
                            </label>

                            <button
                                onClick={handleExportHTML}
                                disabled={bookmarks.length === 0}
                                className="flex items-center gap-3 p-3.5 rounded-xl bg-bg-input hover:bg-bg-card border-2 border-transparent hover:border-primary-orange/30 transition-all group disabled:opacity-50 disabled:cursor-not-allowed text-left"
                            >
                                <div className="w-10 h-10 rounded-full bg-green-500/15 text-green-500 flex items-center justify-center group-hover:scale-110 transition-transform shrink-0">
                                    <FileText className="w-5 h-5" />
                                </div>
                                <div className="min-w-0">
                                    <div className="font-semibold text-text-primary">Export HTML</div>
                                    <div className="text-xs text-text-muted">Chrome/Firefox compatible</div>
                                </div>
                            </button>

                            <button
                                onClick={handleExportJSON}
                                disabled={bookmarks.length === 0 && shortcuts.length === 0}
                                className="flex items-center gap-3 p-3.5 rounded-xl bg-bg-input hover:bg-bg-card border-2 border-transparent hover:border-primary-orange/30 transition-all group disabled:opacity-50 disabled:cursor-not-allowed text-left sm:col-span-2"
                            >
                                <div className="w-10 h-10 rounded-full bg-purple-500/15 text-purple-500 flex items-center justify-center group-hover:scale-110 transition-transform shrink-0">
                                    <FileJson className="w-5 h-5" />
                                </div>
                                <div className="min-w-0">
                                    <div className="font-semibold text-text-primary">Export JSON backup</div>
                                    <div className="text-xs text-text-muted">Full backup with pins, notes, visit counts</div>
                                </div>
                                <Download className="w-4 h-4 text-text-muted ml-auto shrink-0" />
                            </button>
                        </div>
                        <div className="mt-3 pt-3 border-t border-white/5 text-xs text-text-muted">
                            <div>Bookmarks: <span className="font-semibold text-text-primary">{bookmarks.length}</span></div>
                            <div>Shortcuts: <span className="font-semibold text-text-primary">{shortcuts.length}</span></div>
                            <div>Custom engines: <span className="font-semibold text-text-primary">{engines.filter((e) => e.isCustom).length}</span></div>
                        </div>
                    </Section>

                    {/* Privacy / Locks */}
                    <Section icon={<Lock className="w-4 h-4" />} title="Privacy & Locks" accent="text-accent-purple">
                        {!privacy.hasPassword ? (
                            <div className="space-y-3">
                                <p className="text-sm text-text-secondary leading-relaxed">
                                    Set a password to lock individual bookmarks or entire folders. Locked
                                    items require the password to open. Once unlocked, they stay open until you
                                    reload or tap "Lock now".
                                </p>
                                <button
                                    onClick={() => {
                                        setPwSetupMode('setup');
                                        setPwSetupOpen(true);
                                    }}
                                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary-orange text-white font-semibold shadow-orange hover:shadow-lg transition-all"
                                >
                                    <KeyRound className="w-4 h-4" />
                                    Set up password
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <div className="flex items-center gap-3 p-3 rounded-xl bg-bg-input">
                                    <div className="w-10 h-10 rounded-full bg-primary-orange/15 text-primary-orange flex items-center justify-center shrink-0">
                                        <Lock className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-semibold text-text-primary">
                                            Password is set
                                        </div>
                                        <div className="text-xs text-text-muted">
                                            {privacy.unlocked ? 'Currently unlocked for this session' : 'Locked'}
                                        </div>
                                    </div>
                                    {privacy.unlocked && (
                                        <button
                                            onClick={() => {
                                                privacy.relock();
                                                toast.info('Locked');
                                            }}
                                            className="px-3 py-1.5 rounded-lg bg-bg-card text-xs font-semibold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors shrink-0"
                                        >
                                            Lock now
                                        </button>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        onClick={() => {
                                            setPwSetupMode('change');
                                            setPwSetupOpen(true);
                                        }}
                                        className="py-2.5 rounded-xl bg-bg-input text-text-primary text-sm font-semibold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <KeyRound className="w-4 h-4" />
                                        Change
                                    </button>
                                    <button
                                        onClick={handleRemovePassword}
                                        className="py-2.5 rounded-xl bg-red-500/10 text-red-500 text-sm font-semibold hover:bg-red-500/20 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <ShieldOff className="w-4 h-4" />
                                        Remove
                                    </button>
                                </div>

                                {allFolders.length > 0 && (
                                    <div className="pt-3 border-t border-white/5">
                                        <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
                                            Folder locks
                                        </h3>
                                        <div className="space-y-1.5 max-h-64 overflow-y-auto no-scrollbar pr-1">
                                            {allFolders.map((f) => {
                                                const locked = privacy.isFolderLocked(f);
                                                return (
                                                    <button
                                                        key={f}
                                                        onClick={() => toggleFolderLock(f)}
                                                        className="w-full flex items-center gap-3 p-3 rounded-xl bg-bg-input hover:bg-bg-card transition-colors"
                                                    >
                                                        <Folder className="w-4 h-4 text-text-muted shrink-0" />
                                                        <span className="flex-1 text-sm font-medium text-text-primary truncate text-left">
                                                            {f}
                                                        </span>
                                                        {locked ? (
                                                            <span className="flex items-center gap-1 text-xs font-semibold text-primary-orange">
                                                                <Lock className="w-3.5 h-3.5" />
                                                                Locked
                                                            </span>
                                                        ) : (
                                                            <span className="flex items-center gap-1 text-xs text-text-muted">
                                                                <LockOpen className="w-3.5 h-3.5" />
                                                                Unlocked
                                                            </span>
                                                        )}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </Section>

                    {/* Danger Zone */}
                    <div className="bg-bg-card rounded-2xl p-5 lg:p-6 shadow-sm border border-red-500/20">
                        <div className="flex items-center gap-2 mb-4 text-red-500 font-medium text-sm uppercase tracking-wider">
                            <AlertTriangle className="w-4 h-4" />
                            Danger Zone
                        </div>
                        <div className="flex items-center justify-between gap-3">
                            <div className="min-w-0">
                                <div className="font-semibold text-text-primary">Reset all data</div>
                                <div className="text-xs text-text-muted">
                                    Clears bookmarks, shortcuts, and custom engines {user ? '(local + cloud)' : '(local)'}.
                                </div>
                            </div>
                            <button
                                onClick={handleReset}
                                disabled={bookmarks.length === 0 && shortcuts.length === 0}
                                className="px-4 py-2 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-xl font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                            >
                                Reset
                            </button>
                        </div>
                    </div>

                    <p className="text-xs text-text-muted text-center pt-4">
                        WebHome • press <kbd className="bg-bg-input px-1.5 py-0.5 rounded border border-white/10">⌘K</kbd> from anywhere
                    </p>
                </div>
            </div>

            <LoginModal isOpen={loginOpen} onClose={() => setLoginOpen(false)} />
            <PasswordSetupModal
                isOpen={pwSetupOpen}
                onClose={() => setPwSetupOpen(false)}
                mode={pwSetupMode}
            />
        </div>
    );
}

function Section({ icon, title, accent, children }) {
    return (
        <div className="bg-bg-card rounded-2xl p-5 lg:p-6 shadow-sm border border-white/10">
            <div className={`flex items-center gap-2 mb-4 ${accent} font-medium text-sm uppercase tracking-wider`}>
                {icon}
                {title}
            </div>
            {children}
        </div>
    );
}

function downloadFile(content, filename, mime) {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}
