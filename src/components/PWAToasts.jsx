import { useEffect } from 'react';
import { useToast } from '../hooks/useToast';

/**
 * Listens for PWA lifecycle events and surfaces them as toasts.
 * Mount once inside the ToastProvider tree.
 */
export function PWAToasts() {
    const toast = useToast();

    useEffect(() => {
        const onNeedRefresh = (e) => {
            const update = e.detail?.update;
            toast.info('A new version is available', {
                duration: 0,
                action: {
                    label: 'Reload',
                    onClick: () => update?.(true),
                },
            });
        };

        const onOfflineReady = () => {
            toast.success('Offline mode ready', { duration: 3000 });
        };

        window.addEventListener('webhome:pwa-needs-refresh', onNeedRefresh);
        window.addEventListener('webhome:pwa-offline-ready', onOfflineReady);

        return () => {
            window.removeEventListener('webhome:pwa-needs-refresh', onNeedRefresh);
            window.removeEventListener('webhome:pwa-offline-ready', onOfflineReady);
        };
    }, [toast]);

    return null;
}
