import { mount } from 'svelte';
import { registerSW } from 'virtual:pwa-register';
import './app.css';
import App from './App.svelte';

// Registriere den PWA Service Worker für vollständige Offline-Nutzung
registerSW({ immediate: true });

const app = mount(App, {
  target: document.getElementById('app')!,
});

export default app;

