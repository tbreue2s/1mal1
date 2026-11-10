<script lang="ts">
  import { getLogoSvgMarkup } from '../lib/logos';
  import type { LogoVariantId } from '../lib/types';

  interface Props {
    variant?: LogoVariantId;
    size?: number;
  }

  let { variant = 'penguin', size = 40 }: Props = $props();

  let svgHtml = $derived(getLogoSvgMarkup(variant, size));
</script>

<span class="brand-logo-wrap" style="width: {size}px; height: {size}px;" aria-hidden="true">
  {@html svgHtml}
</span>

<style>
  .brand-logo-wrap {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
</style>
