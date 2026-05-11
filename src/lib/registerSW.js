import { registerSW } from "virtual:pwa-register";

// Register the service worker. When a new version deploys, a small toast
// prompts the user to reload.
export function setupPWA() {
  if (typeof window === "undefined") return;
  // Skip SW on localhost dev to avoid caching confusion (we only build it in prod).
  const update = registerSW({
    onNeedRefresh() {
      // Emit a custom event so the UI (Toast provider) can handle it.
      window.dispatchEvent(
        new CustomEvent("webhome:pwa-needs-refresh", {
          detail: { update },
        }),
      );
    },
    onOfflineReady() {
      window.dispatchEvent(new CustomEvent("webhome:pwa-offline-ready"));
    },
  });
}
