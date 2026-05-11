import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";

const PrivacyContext = createContext(null);

const LS_HASH = "privacy.passwordHash";
const LS_LOCKED_FOLDERS = "privacy.lockedFolders";

/**
 * SHA-256 hash via Web Crypto. Returns a hex string.
 * All lock checks are client-side — this is not cryptographically secret; it
 * gatekeeps casual access, not a determined attacker with devtools.
 */
async function sha256(text) {
    const enc = new TextEncoder().encode(text);
    const buf = await crypto.subtle.digest("SHA-256", enc);
    return Array.from(new Uint8Array(buf))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
}

export function PrivacyProvider({ children }) {
    const [passwordHash, setPasswordHash] = useState(
        () => localStorage.getItem(LS_HASH) || null,
    );

    const [lockedFolders, setLockedFolders] = useState(() => {
        try {
            const raw = localStorage.getItem(LS_LOCKED_FOLDERS);
            return new Set(raw ? JSON.parse(raw) : []);
        } catch {
            return new Set();
        }
    });

    // Session-only: once unlocked, unlocked for this tab until reload.
    const [unlocked, setUnlocked] = useState(false);

    // Pending unlock request — component that triggers lock check awaits this.
    const [pendingRequest, setPendingRequest] = useState(null);
    const resolverRef = useRef(null);

    useEffect(() => {
        if (passwordHash) localStorage.setItem(LS_HASH, passwordHash);
        else localStorage.removeItem(LS_HASH);
    }, [passwordHash]);

    useEffect(() => {
        localStorage.setItem(
            LS_LOCKED_FOLDERS,
            JSON.stringify(Array.from(lockedFolders)),
        );
    }, [lockedFolders]);

    const hasPassword = Boolean(passwordHash);

    const setupPassword = useCallback(async (password) => {
        const hash = await sha256(password);
        setPasswordHash(hash);
        setUnlocked(true);
    }, []);

    const changePassword = useCallback(
        async (oldPassword, newPassword) => {
            if (!passwordHash) {
                await setupPassword(newPassword);
                return true;
            }
            const oldHash = await sha256(oldPassword);
            if (oldHash !== passwordHash) return false;
            const newHash = await sha256(newPassword);
            setPasswordHash(newHash);
            return true;
        },
        [passwordHash, setupPassword],
    );

    const removePassword = useCallback(
        async (password) => {
            if (!passwordHash) return true;
            const hash = await sha256(password);
            if (hash !== passwordHash) return false;
            setPasswordHash(null);
            setLockedFolders(new Set());
            setUnlocked(false);
            return true;
        },
        [passwordHash],
    );

    const verify = useCallback(
        async (password) => {
            if (!passwordHash) return false;
            const hash = await sha256(password);
            return hash === passwordHash;
        },
        [passwordHash],
    );

    const lockFolder = useCallback((folder) => {
        setLockedFolders((prev) => {
            const next = new Set(prev);
            next.add(folder);
            return next;
        });
    }, []);

    const unlockFolderPersistent = useCallback((folder) => {
        setLockedFolders((prev) => {
            const next = new Set(prev);
            next.delete(folder);
            return next;
        });
    }, []);

    const relock = useCallback(() => setUnlocked(false), []);

    /**
     * Ask the user to unlock. If already unlocked this session, resolves true.
     * If there's no password, resolves true (no gate).
     * Otherwise opens the unlock modal and resolves with success/cancel.
     */
    const requireUnlock = useCallback(
        (opts = {}) => {
            if (!passwordHash) return Promise.resolve(true);
            if (unlocked) return Promise.resolve(true);
            return new Promise((resolve) => {
                resolverRef.current = resolve;
                setPendingRequest({
                    reason: opts.reason || "Enter password to continue",
                });
            });
        },
        [passwordHash, unlocked],
    );

    const resolvePending = useCallback((success) => {
        if (resolverRef.current) resolverRef.current(success);
        resolverRef.current = null;
        setPendingRequest(null);
        if (success) setUnlocked(true);
    }, []);

    const isFolderLocked = useCallback(
        (folder) => passwordHash && lockedFolders.has(folder),
        [passwordHash, lockedFolders],
    );

    const isBookmarkLocked = useCallback(
        (bookmark) => {
            if (!passwordHash) return false;
            if (bookmark?.locked) return true;
            if (bookmark?.folder && lockedFolders.has(bookmark.folder)) return true;
            return false;
        },
        [passwordHash, lockedFolders],
    );

    const canShowLocked = unlocked;

    const value = useMemo(
        () => ({
            hasPassword,
            unlocked,
            canShowLocked,
            lockedFolders,
            setupPassword,
            changePassword,
            removePassword,
            verify,
            lockFolder,
            unlockFolderPersistent,
            relock,
            requireUnlock,
            isFolderLocked,
            isBookmarkLocked,
            pendingRequest,
            resolvePending,
        }),
        [
            hasPassword,
            unlocked,
            canShowLocked,
            lockedFolders,
            setupPassword,
            changePassword,
            removePassword,
            verify,
            lockFolder,
            unlockFolderPersistent,
            relock,
            requireUnlock,
            isFolderLocked,
            isBookmarkLocked,
            pendingRequest,
            resolvePending,
        ],
    );

    return (
        <PrivacyContext.Provider value={value}>{children}</PrivacyContext.Provider>
    );
}

export function usePrivacy() {
    const ctx = useContext(PrivacyContext);
    if (!ctx) throw new Error("usePrivacy must be used within PrivacyProvider");
    return ctx;
}
