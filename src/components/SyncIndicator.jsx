import { Cloud, CloudOff, Loader2, AlertTriangle, HardDrive } from 'lucide-react';

export function SyncIndicator({ mode, syncState, onClick, compact = false }) {
    const cloud = mode === 'cloud';
    let Icon, label, tint;

    if (!cloud) {
        Icon = HardDrive;
        label = 'Local only';
        tint = 'text-text-muted';
    } else if (syncState === 'syncing') {
        Icon = Loader2;
        label = 'Syncing…';
        tint = 'text-primary-orange';
    } else if (syncState === 'error') {
        Icon = AlertTriangle;
        label = 'Sync error';
        tint = 'text-red-500';
    } else if (syncState === 'synced') {
        Icon = Cloud;
        label = 'Synced';
        tint = 'text-emerald-500';
    } else {
        Icon = CloudOff;
        label = 'Offline';
        tint = 'text-text-muted';
    }

    const spin = syncState === 'syncing' ? 'animate-spin' : '';

    if (compact) {
        return (
            <button
                onClick={onClick}
                className={`p-1.5 rounded-full transition-colors ${tint} hover:bg-white/10`}
                title={label}
            >
                <Icon className={`w-4 h-4 ${spin}`} />
            </button>
        );
    }

    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold backdrop-blur-md bg-bg-card/40 border border-white/10 ${tint} hover:bg-white/10 transition-colors`}
            title={cloud ? 'Signed in — click for details' : 'Click to sign in and sync'}
        >
            <Icon className={`w-3.5 h-3.5 ${spin}`} />
            <span>{label}</span>
        </button>
    );
}
