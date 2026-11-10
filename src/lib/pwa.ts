import { registerSW } from 'virtual:pwa-register';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

let updateSWCallback: ((reloadPage?: boolean) => Promise<void>) | null = null;
const listeners = new Set<(needRefresh: boolean) => void>();
let needRefreshState = false;

let deferredInstallPrompt: BeforeInstallPromptEvent | null = null;
const installListeners = new Set<(canInstall: boolean) => void>();

export function initPWAUpdater(): void {
  if (typeof window === 'undefined') return;

  window.addEventListener('beforeinstallprompt', (e: Event) => {
    e.preventDefault();
    deferredInstallPrompt = e as BeforeInstallPromptEvent;
    installListeners.forEach((fn) => fn(true));
  });

  window.addEventListener('appinstalled', () => {
    deferredInstallPrompt = null;
    installListeners.forEach((fn) => fn(false));
  });

  try {
    updateSWCallback = registerSW({
      immediate: true,
      onNeedRefresh() {
        needRefreshState = true;
        listeners.forEach((fn) => fn(true));
      },
      onRegisteredSW(_swUrl, registration) {
        if (registration) {
          // Prüfe regelmäßig im Hintergrund auf neue Versionen
          setInterval(() => {
            registration.update().catch(() => {});
          }, 60 * 60 * 1000);
        }
      },
    });
  } catch {
    // Fallback, falls Service Worker im Browser deaktiviert ist
  }
}

export function subscribePWAUpdate(fn: (needRefresh: boolean) => void): () => void {
  fn(needRefreshState);
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export function subscribePWAInstallable(fn: (canInstall: boolean) => void): () => void {
  fn(deferredInstallPrompt !== null);
  installListeners.add(fn);
  return () => {
    installListeners.delete(fn);
  };
}

export async function triggerPWAInstall(): Promise<boolean> {
  if (!deferredInstallPrompt) return false;
  try {
    await deferredInstallPrompt.prompt();
    const choice = await deferredInstallPrompt.userChoice;
    if (choice.outcome === 'accepted') {
      deferredInstallPrompt = null;
      installListeners.forEach((fn) => fn(false));
      return true;
    }
  } catch {
    // Ignorieren
  }
  return false;
}

/**
 * Prüft aktiv auf ein PWA-Update, leert veraltete Service-Worker-Asset-Caches
 * (ohne localStorage-Nutzerdaten anzutasten!) und lädt die neueste App-Version.
 */
export async function forcePWAUpdate(): Promise<void> {
  if (typeof window === 'undefined') return;

  try {
    if (needRefreshState && updateSWCallback) {
      await updateSWCallback(true);
      return;
    }

    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const reg of registrations) {
        await reg.update();
        if (reg.waiting) {
          reg.waiting.postMessage({ type: 'SKIP_WAITING' });
        }
      }
    }

    if ('caches' in window) {
      const keys = await window.caches.keys();
      await Promise.all(keys.map((key) => window.caches.delete(key)));
    }
  } catch {
    // Ignorieren
  }

  window.location.reload();
}

