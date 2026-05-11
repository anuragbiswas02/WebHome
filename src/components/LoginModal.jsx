import { useEffect, useState } from 'react';
import { X, LogIn, Cloud, Loader2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';

export function LoginModal({ isOpen, onClose }) {
    const { signIn, configured } = useAuth();
    const toast = useToast();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            setEmail('');
            setPassword('');
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email.trim() || !password) return;
        setBusy(true);
        setError('');
        try {
            await signIn(email.trim(), password);
            toast.success('Signed in — your bookmarks will sync');
            onClose();
        } catch (err) {
            const code = err?.code || '';
            const msg =
                code === 'auth/invalid-credential' || code === 'auth/wrong-password'
                    ? 'Incorrect email or password'
                    : code === 'auth/user-not-found'
                        ? 'No account with that email'
                        : code === 'auth/too-many-requests'
                            ? 'Too many attempts — try again shortly'
                            : err?.message || 'Sign in failed';
            setError(msg);
        } finally {
            setBusy(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end lg:items-center justify-center p-0 lg:p-4 z-[150] anim-backdrop"
            onClick={onClose}
        >
            <div
                className="w-full lg:max-w-sm bg-bg-card rounded-t-3xl lg:rounded-2xl shadow-float border border-white/10 anim-sheet-up lg:anim-pop"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between p-5 border-b border-white/5">
                    <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-primary-orange/15 text-primary-orange flex items-center justify-center">
                            <Cloud className="w-5 h-5" />
                        </div>
                        <h2 className="text-lg font-bold text-text-primary">Sign in to sync</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-9 h-9 rounded-full bg-bg-input flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                        aria-label="Close"
                    >
                        <X className="w-5 h-5 text-text-secondary" />
                    </button>
                </div>

                {!configured ? (
                    <div className="p-5 text-sm text-text-secondary">
                        <p>
                            Cloud sync isn't configured for this deployment. Set the{' '}
                            <code className="text-xs bg-bg-input px-1.5 py-0.5 rounded">VITE_FIREBASE_*</code>{' '}
                            environment variables to enable it.
                        </p>
                        <p className="mt-3">
                            Your bookmarks will continue to work locally in this browser.
                        </p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="p-5 space-y-4">
                        <p className="text-sm text-text-secondary leading-relaxed">
                            Sign in with the single account configured for this dashboard to
                            sync your bookmarks across devices.
                        </p>

                        <div>
                            <label className="block text-sm font-semibold text-text-secondary mb-2">Email</label>
                            <input
                                type="email"
                                inputMode="email"
                                autoComplete="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@example.com"
                                required
                                autoFocus
                                className="w-full py-3 px-4 rounded-xl bg-bg-input border-2 border-transparent text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary-orange focus:bg-bg-card transition-all"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-text-secondary mb-2">Password</label>
                            <input
                                type="password"
                                autoComplete="current-password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                                className="w-full py-3 px-4 rounded-xl bg-bg-input border-2 border-transparent text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary-orange focus:bg-bg-card transition-all"
                            />
                        </div>

                        {error && (
                            <div className="px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-sm text-red-500">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={busy || !email.trim() || !password}
                            className="w-full py-3 rounded-xl bg-primary-orange text-white font-semibold shadow-orange hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {busy ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Signing in…
                                </>
                            ) : (
                                <>
                                    <LogIn className="w-4 h-4" />
                                    Sign in
                                </>
                            )}
                        </button>

                        <p className="text-xs text-text-muted text-center leading-relaxed">
                            Your data stays encrypted in transit. Without sign-in, bookmarks stay on this device only.
                        </p>
                    </form>
                )}
            </div>
        </div>
    );
}
