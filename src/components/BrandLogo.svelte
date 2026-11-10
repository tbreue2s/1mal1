<script lang="ts">
  import { getLogoPngDataUrl, getLogoSvgMarkup } from '../lib/logos';
  import type { LogoVariantId } from '../lib/types';

  interface Props {
    variant?: LogoVariantId;
    size?: number;
  }

  let { variant = 'penguin', size = 40 }: Props = $props();

  let pngUrl = $state<string>('');
  let svgHtml = $derived(getLogoSvgMarkup(variant, size));

  $effect(() => {
    const currentVariant = variant;
    getLogoPngDataUrl(currentVariant).then((url) => {
      if (currentVariant === variant && url) {
        pngUrl = url;
      }
    });
  });
</script>

<span
  class="brand-logo-wrap"
  style="width: {size}px; height: {size}px;"
  aria-hidden="true"
>
  {#if pngUrl}
    <img
      src={pngUrl}
      width={size}
      height={size}
      alt=""
      class="brand-logo-img"
      draggable="false"
    />
  {:else}
    {@html svgHtml}
  {/if}
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
