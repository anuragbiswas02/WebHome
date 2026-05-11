import { useEffect, useState } from 'react';
import { X, Lock, Unlock, Loader2, AlertCircle } from 'lucide-react';
import { usePrivacy } from '../hooks/usePrivacy';

/**
 * Two roles:
 * - When `mode` is "unlock" (default): verify the existing password.
 * - When `mode` is "setup": create or change a password.
 *
 * This component is also driven by the PrivacyProvider's pending-unlock queue,
 * so call `requireUnlock()` from anywhere and it will auto-open.
 */
export function PasswordGate() {
    const { pendingRequest, resolvePending, verify } = usePrivacy();
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        if (pendingRequest) {
            setPassword('');
            setError('');
            setBusy(false);
        }
    }, [pendingRequest]);

    useEffect(() => {
        if (!pendingRequest) return;
        const onKey = (e) => {
            if (e.key === 'Escape') resolvePending(false);
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [pendingRequest, resolvePending]);

    if (!pendingRequest) return null;

    const submit = async (e) => {
        e.preventDefault();
        if (!password) return;
        setBusy(true);
        const ok = await verify(password);
        setBusy(false);
        if (ok) {
            resolvePending(true);
        } else {
            setError('Incorrect password');
        }
    };

    return (
        <div
            className="fixed inset-0 z-[400] bg-black/60 backdrop-blur-sm flex items-end lg:items-center justify-center p-0 lg:p-4 anim-backdrop"
            onClick={() => resolvePending(false)}
        >
            <div
                className="w-full lg:max-w-sm bg-bg-card rounded-t-3xl lg:rounded-2xl shadow-float border border-white/10 anim-sheet-up lg:anim-pop"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-5 lg:p-6">
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3 min-w-0">
                            <div className="w-11 h-11 rounded-xl bg-primary-orange/15 text-primary-orange flex items-center justify-center shrink-0">
                                <Lock className="w-5 h-5" />
                            </div>
                            <div className="min-w-0">
                                <h2 className="text-lg font-bold text-text-primary leading-tight">
                                    Locked
                                </h2>
                                <p className="text-sm text-text-secondary">
                                    {pendingRequest.reason}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => resolvePending(false)}
                            className="w-9 h-9 rounded-full bg-bg-input flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors shrink-0"
                            aria-label="Cancel"
                        >
                            <X className="w-5 h-5 text-text-secondary" />
                        </button>
                    </div>

                    <form onSubmit={submit} className="space-y-3">
                        <input
                            type="password"
                            autoFocus
                            value={password}
                            onChange={(e) => {
                                setPassword(e.target.value);
                                if (error) setError('');
                            }}
                            placeholder="Password"
                            className="w-full py-3 px-4 rounded-xl bg-bg-input border-2 border-transparent focus:border-primary-orange focus:bg-bg-card text-text-primary placeholder:text-text-muted outline-none transition-all"
                        />
                        {error && (
                            <div className="flex items-center gap-2 text-sm text-red-500">
                                <AlertCircle className="w-4 h-4 shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}
                        <button
                            type="submit"
                            disabled={!password || busy}
                            className="w-full py-3 rounded-xl bg-primary-orange text-white font-semibold shadow-orange hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                        >
                            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Unlock className="w-4 h-4" />}
                            Unlock
                        </button>
                    </form>

                    <p className="text-xs text-text-muted text-center mt-4">
                        Unlock stays active until you close this tab or lock again from settings.
                    </p>
                </div>
            </div>
        </div>
    );
}

export function PasswordSetupModal({ isOpen, onClose, mode = 'setup' }) {
    const { setupPassword, changePassword, hasPassword } = usePrivacy();
    const [oldPw, setOldPw] = useState('');
    const [pw, setPw] = useState('');
    const [pw2, setPw2] = useState('');
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setOldPw('');
            setPw('');
            setPw2('');
            setError('');
            setBusy(false);
        }
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) return;
        const onKey = (e) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const isChange = mode === 'change' && hasPassword;

    const submit = async (e) => {
        e.preventDefault();
        setError('');
        if (pw.length < 4) {
            setError('Use at least 4 characters');
            return;
        }
        if (pw !== pw2) {
            setError('Passwords do not match');
            return;
        }
        setBusy(true);
        if (isChange) {
            const ok = await changePassword(oldPw, pw);
            setBusy(false);
            if (!ok) {
                setError('Current password is incorrect');
                return;
            }
        } else {
            await setupPassword(pw);
            setBusy(false);
        }
        onClose();
    };

    return (
        <div
            className="fixed inset-0 z-[400] bg-black/60 backdrop-blur-sm flex items-end lg:items-center justify-center p-0 lg:p-4 anim-backdrop"
            onClick={onClose}
        >
            <div
                className="w-full lg:max-w-sm bg-bg-card rounded-t-3xl lg:rounded-2xl shadow-float border border-white/10 anim-sheet-up lg:anim-pop"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between p-5 border-b border-white/5">
                    <h2 className="text-lg font-bold text-text-primary">
                        {isChange ? 'Change password' : 'Set a password'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="w-9 h-9 rounded-full bg-bg-input flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                        aria-label="Close"
                    >
                        <X className="w-5 h-5 text-text-secondary" />
                    </button>
                </div>

                <form onSubmit={submit} className="p-5 space-y-3">
                    <p className="text-sm text-text-secondary leading-relaxed">
                        Locks gate access to private bookmarks or folders on this device.
                        The password is stored as a SHA-256 hash — it's only a casual gate, not a vault.
                    </p>

                    {isChange && (
                        <input
                            type="password"
                            value={oldPw}
                            onChange={(e) => setOldPw(e.target.value)}
                            placeholder="Current password"
                            required
                            autoFocus
                            className="w-full py-3 px-4 rounded-xl bg-bg-input border-2 border-transparent focus:border-primary-orange focus:bg-bg-card outline-none transition-all"
                        />
                    )}
                    <input
                        type="password"
                        value={pw}
                        onChange={(e) => setPw(e.target.value)}
                        placeholder="New password"
                        autoFocus={!isChange}
                        required
                        className="w-full py-3 px-4 rounded-xl bg-bg-input border-2 border-transparent focus:border-primary-orange focus:bg-bg-card outline-none transition-all"
                    />
                    <input
                        type="password"
                        value={pw2}
                        onChange={(e) => setPw2(e.target.value)}
                        placeholder="Confirm password"
                        required
                        className="w-full py-3 px-4 rounded-xl bg-bg-input border-2 border-transparent focus:border-primary-orange focus:bg-bg-card outline-none transition-all"
                    />

                    {error && (
                        <div className="flex items-center gap-2 text-sm text-red-500">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={busy}
                        className="w-full py-3 rounded-xl bg-primary-orange text-white font-semibold shadow-orange hover:shadow-lg disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                    >
                        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                        {isChange ? 'Update password' : 'Set password'}
                    </button>
                </form>
            </div>
        </div>
    );
}
