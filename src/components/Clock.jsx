import { useState, useEffect } from 'react';

export function Clock({ hasWallpaper }) {
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const parts = time
        .toLocaleTimeString([], {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
        })
        .split(' ');
    const clock = parts[0]; // "8:30"
    const meridiem = (parts[1] || '').toUpperCase(); // "AM" / "PM"

    const dateStr = time.toLocaleDateString([], {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
    });

    const textColorClass = hasWallpaper ? 'text-white drop-shadow-lg' : 'text-text-primary';

    return (
        <div className="flex flex-col items-center justify-center py-8 select-none anim-fade-in">
            <h1
                className={`text-6xl lg:text-8xl font-bold tracking-tight mb-2 transition-colors duration-300 flex items-end justify-center gap-3 ${textColorClass}`}
            >
                <span className="tabular-nums">{clock}</span>
                <span
                    className={`text-xl lg:text-3xl font-semibold mb-2 lg:mb-3 opacity-80 ${textColorClass}`}
                >
                    {meridiem}
                </span>
            </h1>
            <p
                className={`text-lg lg:text-2xl font-medium opacity-90 transition-colors duration-300 ${textColorClass}`}
            >
                {dateStr}
            </p>
        </div>
    );
}
