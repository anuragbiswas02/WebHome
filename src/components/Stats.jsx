import { Moon, Sun } from 'lucide-react';

export function Stats({ theme, toggleTheme, username, bookmarksCount = 0 }) {
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 5) return 'Good Night';
        if (hour < 12) return 'Good Morning';
        if (hour < 17) return 'Good Afternoon';
        if (hour < 21) return 'Good Evening';
        return 'Good Night';
    };

    return (
        <div className="hidden lg:flex gap-8 absolute top-8 left-12 z-20 text-white select-none items-center">
            <div className="flex flex-col">
                <h1 className="text-3xl font-bold leading-none mb-1 drop-shadow-md">
                    {getGreeting()}, <span className="text-primary-orange">{username || 'User'}</span>
                </h1>
                <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-xs font-semibold opacity-90 tracking-wide drop-shadow-sm">
                        {bookmarksCount} {bookmarksCount === 1 ? 'bookmark' : 'bookmarks'} saved
                    </span>
                    <span className="text-xs opacity-60">•</span>
                    <button
                        onClick={toggleTheme}
                        className="flex items-center gap-1.5 text-xs font-semibold opacity-90 hover:opacity-100 transition-all hover:text-primary-orange drop-shadow-sm"
                    >
                        {theme === 'light' ? (
                            <>
                                <Moon className="w-3 h-3" />
                                <span>Dark</span>
                            </>
                        ) : (
                            <>
                                <Sun className="w-3 h-3" />
                                <span>Light</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
