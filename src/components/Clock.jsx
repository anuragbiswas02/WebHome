import { useState, useEffect } from 'react';

export function Clock({ theme, hasWallpaper }) {
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => {
            setTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const formatTime = (date) => {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    };

    const formatDate = (date) => {
        return date.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });
    };

    // Determine text color class based on context
    // If wallpaper is active, use white text with drop shadow for readability
    // If no wallpaper, use standard text color
    const textColorClass = hasWallpaper ? 'text-white drop-shadow-lg' : 'text-text-primary';

    return (
        <div className="flex flex-col items-center justify-center py-8 select-none">
            <h1 className={`text-6xl lg:text-8xl font-bold tracking-tight mb-2 transition-colors duration-300 ${textColorClass}`}>
                {formatTime(time)}
            </h1>
            <p className={`text-lg lg:text-2xl font-medium opacity-90 transition-colors duration-300 ${textColorClass}`}>
                {formatDate(time)}
            </p>
        </div>
    );
}
