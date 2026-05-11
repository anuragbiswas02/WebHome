import { Outlet, createRootRoute } from '@tanstack/react-router';
import { AuthProvider } from '../hooks/useAuth';
import { ToastProvider } from '../hooks/useToast';
import { ConfirmProvider } from '../hooks/useConfirm';
import { PrivacyProvider } from '../hooks/usePrivacy';
import { ToastContainer } from '../components/Toast';
import { PasswordGate } from '../components/PasswordModal';
import { PWAToasts } from '../components/PWAToasts';
import { ExtensionBridge } from '../components/ExtensionBridge';

export const Route = createRootRoute({
    component: RootLayout,
});

function RootLayout() {
    return (
        <AuthProvider>
            <ToastProvider>
                <ConfirmProvider>
                    <PrivacyProvider>
                        <Outlet />
                        <ToastContainer />
                        <PasswordGate />
                        <PWAToasts />
                        <ExtensionBridge />
                    </PrivacyProvider>
                </ConfirmProvider>
            </ToastProvider>
        </AuthProvider>
    );
}
