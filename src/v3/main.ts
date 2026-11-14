import { mount } from 'svelte';
import './app.css';
import App from './App.svelte';
import { themeManager } from '../lib/theme.svelte';

themeManager.init();

const app = mount(App, {
  target: document.getElementById('app')!,
});

export default app;
