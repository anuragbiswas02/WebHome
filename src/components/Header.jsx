import { Moon, Sun, Image, Eye, EyeOff, Menu, X, Settings } from 'lucide-react';
import { useState } from 'react';

export function Header({
    theme,
    toggleTheme,
    onRefreshWallpaper,
    toggleWallpaperVisibility,
    isWallpaperVisible,
    username,
    onOpenSettings
}) {


    const [isMenuOpen, setIsMenuOpen] = useState(false);

    return (
        <header className="px-5 pt-5 pb-3 lg:px-12 lg:pt-6 lg:pb-4">
            <div className="flex items-center justify-end max-w-7xl mx-auto">
                <div className="relative">
                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="w-10 h-10 rounded-xl bg-bg-card flex items-center justify-center shadow-sm hover:shadow-md transition-all active:scale-95"
                    >
                        {isMenuOpen ? <X className="w-5 h-5 text-text-primary" /> : <Menu className="w-5 h-5 text-text-primary" />}
                    </button>

                    {/* Dropdown Menu */}
                    {isMenuOpen && (
                        <div className="absolute right-0 top-12 flex flex-col gap-2 p-2 bg-bg-card rounded-2xl shadow-float border border-gray-100/50 animate-in fade-in slide-in-from-top-2 z-50 min-w-12">
                            <button
                                onClick={() => {
                                    onOpenSettings();
                                    setIsMenuOpen(false);
                                }}
                                className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-bg-input text-text-primary transition-colors"
                                title="Settings"
                            >
                                <Settings className="w-5 h-5" />
                            </button>

                            <button
                                onClick={() => {
                                    toggleWallpaperVisibility();
                                    setIsMenuOpen(false);
                                }}
                                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${isWallpaperVisible ? 'bg-primary-orange text-white shadow-orange' : 'hover:bg-bg-input text-text-primary'}`}
                                title={isWallpaperVisible ? "Hide Wallpaper" : "Show Wallpaper"}
                            >
                                {isWallpaperVisible ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                            </button>

                            {isWallpaperVisible && (
                                <button
                                    onClick={() => {
                                        onRefreshWallpaper();
                                        setIsMenuOpen(false);
                                    }}
                                    className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-bg-input text-text-primary transition-colors"
                                    title="Shuffle Wallpaper"
                                >
                                    <Image className="w-5 h-5" />
                                </button>
                            )}

                            <button
                                onClick={() => {
                                    toggleTheme();
                                    setIsMenuOpen(false);
                                }}
                                className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-bg-input text-text-primary transition-colors"
                                title="Toggle Theme"
                            >
                                {theme === 'light' ? (
                                    <Moon className="w-5 h-5" />
                                ) : (
                                    <Sun className="w-5 h-5" />
                                )}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
