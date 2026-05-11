import { useEffect } from 'react';
import { useBookmarks } from '../hooks/useBookmarks';
import { useToast } from '../hooks/useToast';

/**
 * Placeholder for future browser-extension integration.
 *
 * A companion extension can send messages to this tab via `window.postMessage`
 * using the envelope below. The handler runs inside the React tree so it can
 * call the same hooks that the rest of the app uses.
 *
 * Message shape (from extension content script):
 *   window.postMessage({
 *     source: 'webhome-ext',
 *     version: 1,
 *     type: 'add-bookmark' | 'add-bookmarks',
 *     payload: { title, url, folder?, notes? } | [ { ... } ],
 *   }, '*');
 *
 * Safety:
 * - Only messages originating from the same window are processed (the extension
 *   content script posts into the page).
 * - `source` must equal "webhome-ext".
 * - Any URL without http(s) is ignored.
 *
 * Future ideas:
 * - 'auto-bookmark' events driven by page-usage heuristics in the extension
 *   (dwell time, scroll depth, explicit "save this page" click).
 * - A 'sync-state' outbound message so the extension knows whether to send
 *   straight to Firebase or drop into a local queue.
 */
export function ExtensionBridge() {
    const { addBookmark } = useBookmarks();
    const toast = useToast();

    useEffect(() => {
        const handler = (event) => {
            if (event.source !== window) return;
            const msg = event.data;
            if (!msg || typeof msg !== 'object' || msg.source !== 'webhome-ext') return;

            const accept = (bm) => {
                if (!bm?.url || !/^https?:\/\//i.test(bm.url)) return false;
                addBookmark({
                    title: String(bm.title || bm.url).slice(0, 200),
                    url: bm.url,
                    folder: bm.folder ? String(bm.folder).slice(0, 80) : '',
                    notes: bm.notes ? String(bm.notes).slice(0, 1000) : '',
                });
                return true;
            };

            if (msg.type === 'add-bookmark') {
                if (accept(msg.payload)) {
                    toast.success('Saved via extension');
                }
            } else if (msg.type === 'add-bookmarks' && Array.isArray(msg.payload)) {
                const count = msg.payload.reduce((n, bm) => n + (accept(bm) ? 1 : 0), 0);
                if (count) toast.success(`Saved ${count} bookmark${count === 1 ? '' : 's'} via extension`);
            }
            // Unknown types are ignored silently.
        };

        window.addEventListener('message', handler);

        // Announce readiness so extensions can feature-detect.
        window.dispatchEvent(new CustomEvent('webhome:ready'));
        // Also expose a tiny API surface for a content script to call directly.
        window.__webhome = Object.assign(window.__webhome || {}, {
            version: 1,
            ready: true,
        });

        return () => window.removeEventListener('message', handler);
    }, [addBookmark, toast]);

    return null;
}
