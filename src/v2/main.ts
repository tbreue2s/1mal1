import { mount } from 'svelte';
import './v2.css';
import AppV2 from './AppV2.svelte';

const app = mount(AppV2, {
  target: document.getElementById('app')!,
});

export default app;
