import { Moon, Sun } from 'lucide-react';

export function Stats({ theme, toggleTheme, username }) {
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 17) return 'Good Afternoon';
        return 'Good Evening';
    };

    return (
        <div className="hidden lg:flex gap-8 absolute top-8 left-12 z-20 text-white select-none items-center">
            <div className="flex flex-col">
                <h1 className="text-3xl font-bold leading-none mb-1 shadow-black/20 drop-shadow-md">
                    {getGreeting()}, <span className="text-primary-orange">{username || 'User'}</span>
                </h1>
                <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs font-semibold opacity-90 tracking-wide shadow-black/20 drop-shadow-sm">
                        Personal Dashboard
                    </span>
                    <span className="text-xs opacity-60">•</span>
                    <button
                        onClick={toggleTheme}
                        className="flex items-center gap-1.5 text-xs font-semibold opacity-90 hover:opacity-100 transition-opacity hover:text-primary-orange shadow-black/20 drop-shadow-sm"
                    >
                        {theme === 'light' ? (
                            <>
                                <Moon className="w-3 h-3" />
                                <span>Dark Mode</span>
                            </>
                        ) : (
                            <>
                                <Sun className="w-3 h-3" />
                                <span>Light Mode</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
