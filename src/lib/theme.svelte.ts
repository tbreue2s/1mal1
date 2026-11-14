export type ThemeMode = 'system' | 'light' | 'dark';

const THEME_STORAGE_KEY = 'v3_theme_preference';
const THEME_STORAGE_KEY_LEGACY = 'v2_theme_preference';

class ThemeManager {
  mode = $state<ThemeMode>('system');
  isDark = $state<boolean>(false);

  init() {
    if (typeof window === 'undefined') return;

    try {
      const saved =
        window.localStorage.getItem(THEME_STORAGE_KEY) ||
        window.localStorage.getItem(THEME_STORAGE_KEY_LEGACY);
      if (saved === 'light' || saved === 'dark' || saved === 'system') {
        this.mode = saved;
      } else {
        this.mode = 'system';
      }
    } catch {
      this.mode = 'system';
    }

    this.apply();

    if (window.matchMedia) {
      window
        .matchMedia('(prefers-color-scheme: dark)')
        .addEventListener('change', () => {
          if (this.mode === 'system') {
            this.apply();
          }
        });
    }
  }

  setMode(mode: ThemeMode) {
    this.mode = mode;
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, mode);
      window.localStorage.setItem(THEME_STORAGE_KEY_LEGACY, mode);
    } catch {
      // Ignorieren
    }
    this.apply();
  }

  apply() {
    if (typeof window === 'undefined') return;
    const systemDark =
      window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: dark)').matches;
    const shouldBeDark =
      this.mode === 'dark' || (this.mode === 'system' && systemDark);

    this.isDark = shouldBeDark;
    document.documentElement.classList.toggle('dark', shouldBeDark);
    document.documentElement.classList.toggle('light', !shouldBeDark);

    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) {
      metaTheme.setAttribute('content', shouldBeDark ? '#0b0f19' : '#ffffff');
    }
  }
}

export const themeManager = new ThemeManager();
