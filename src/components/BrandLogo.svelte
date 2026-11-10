<script lang="ts">
  import { getLogoPngPath } from '../lib/logos';
  import type { LogoVariantId } from '../lib/types';

  interface Props {
    variant?: LogoVariantId;
    size?: number;
  }

  let { variant = 'penguin', size = 40 }: Props = $props();

  let pngPath = $derived(getLogoPngPath(variant));
</script>

<span
  class="brand-logo-wrap"
  style="width: {size}px; height: {size}px;"
  aria-hidden="true"
>
  <img
    src={pngPath}
    width={size}
    height={size}
    alt=""
    class="brand-logo-img"
    draggable="false"
  />
</span>

<style>
  .brand-logo-wrap {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    color-scheme: only light;
    forced-color-adjust: none;
  }

  .brand-logo-img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: contain;
    color-scheme: only light;
    forced-color-adjust: none;
  }
</style>
