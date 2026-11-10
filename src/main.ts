import { mount } from 'svelte';
import { initPWAUpdater } from './lib/pwa';
import './app.css';
import App from './App.svelte';

// Initialisiere den PWA Service Worker inkl. Update-Erkennung
initPWAUpdater();

const app = mount(App, {
  target: document.getElementById('app')!,
});

export default app;
