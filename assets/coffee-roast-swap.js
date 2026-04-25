/**
 * Coffee Roast Style filter sync.
 *
 * When the Coffee Roast Style filter is active on a collection or search page,
 * each coffee product card is rewritten to display (and link to) the matching
 * variant. Apparel/merch (no `data-coffee-card` attribute) is untouched.
 *
 * Hooked in two ways so it survives the section morph that happens on every
 * filter change:
 *   1. ThemeEvents.FilterUpdate (immediate intent, applied after morph settles)
 *   2. MutationObserver on the grid (catches morph + infinite scroll)
 */

import { ThemeEvents } from '@theme/events';

const CARD_SELECTOR = '[data-coffee-card="true"]';
const VARIANTS_SCRIPT_SELECTOR = 'script[type="application/json"][data-coffee-variants]';
const FILTER_PARAM_PREFIX = 'filter.v.option';

/**
 * Read the active roast value by scanning every `filter.v.option*` URL param
 * and matching its value against the roast values declared on the card. We
 * don't hardcode the param name — Shopify generates it from the option name
 * configured in Search & Discovery and it can vary by store.
 *
 * @param {Array<{roast: string}>} variants
 * @returns {string | null}
 */
function readActiveRoast(variants) {
  const params = new URLSearchParams(window.location.search);
  const knownRoasts = new Set(
    variants.map((v) => (v.roast || '').toLowerCase()).filter(Boolean)
  );

  for (const [key, value] of params.entries()) {
    if (!key.startsWith(FILTER_PARAM_PREFIX)) continue;
    if (knownRoasts.has(value.toLowerCase())) return value;
  }
  return null;
}

/**
 * @param {Element} card
 * @returns {Array | null}
 */
function readVariants(card) {
  const script = card.querySelector(VARIANTS_SCRIPT_SELECTOR);
  if (!script || !script.textContent) return null;
  try {
    return JSON.parse(script.textContent);
  } catch {
    return null;
  }
}

/**
 * Build a product URL with the variant id appended, preserving any existing
 * query params on the base URL (rare, but possible).
 *
 * @param {string} baseUrl
 * @param {number|string} variantId
 */
function buildVariantUrl(baseUrl, variantId) {
  const url = new URL(baseUrl, window.location.origin);
  url.searchParams.set('variant', String(variantId));
  return url.pathname + url.search;
}

/**
 * @param {Element} card
 * @param {object} variant
 */
function applyVariantToCard(card, variant) {
  const baseUrl = card.getAttribute('data-product-base-url');
  if (!baseUrl) return;

  const newHref = buildVariantUrl(baseUrl, variant.id);

  // Card link + gallery link both navigate to the PDP — point both at the variant.
  for (const link of card.querySelectorAll('a.product-card__link, a[ref="cardGalleryLink"], .card-gallery > a')) {
    link.setAttribute('href', newHref);
  }

  // Price text (covers .price + .compare-at-price spans rendered by snippets/price.liquid).
  const priceEl = card.querySelector(`product-price[data-product-id]`);
  if (priceEl) {
    for (const node of priceEl.querySelectorAll('.price')) {
      node.textContent = variant.price;
    }
    for (const node of priceEl.querySelectorAll('.compare-at-price')) {
      if (variant.compare_at_price && variant.compare_at_price !== variant.price) {
        node.textContent = variant.compare_at_price;
        node.removeAttribute('hidden');
      } else {
        node.textContent = '';
      }
    }
  }

  // Swap the visible card image (first non-hidden <img> inside the gallery).
  const gallery = card.querySelector('.card-gallery');
  if (gallery && variant.image_src) {
    const img = gallery.querySelector('slideshow-slide:not([hidden]) img, img');
    if (img) {
      img.setAttribute('src', variant.image_src);
      img.removeAttribute('srcset');
      if (variant.image_alt) img.setAttribute('alt', variant.image_alt);
      if (variant.image_width) img.setAttribute('width', String(variant.image_width));
      if (variant.image_height) img.setAttribute('height', String(variant.image_height));
    }
  }

  // Sold-out hint other code can hook into for styling.
  card.toggleAttribute('data-sold-out', variant.available === false);
}

/**
 * @param {Element} card
 */
function syncCard(card) {
  const variants = readVariants(card);
  if (!variants || variants.length === 0) return;

  const activeRoast = readActiveRoast(variants);
  const target = activeRoast
    ? variants.find((v) => (v.roast || '').toLowerCase() === activeRoast.toLowerCase())
    : null;

  if (!target) {
    // No matching filter — restore the default by reapplying the first available
    // variant. (The morph already restored server-rendered defaults, so we only
    // need to act when a filter is set.)
    return;
  }

  applyVariantToCard(card, target);
}

function syncAll(root = document) {
  for (const card of root.querySelectorAll(CARD_SELECTOR)) {
    syncCard(card);
  }
}

// Initial sync on import. The product-card snippet injects this script tag so
// importing here is enough — it runs once per page even when many cards include
// the tag (browsers dedupe ES modules by URL).
syncAll();

document.addEventListener(ThemeEvents.FilterUpdate, () => {
  // Fired before the section morph completes. The MutationObserver below picks
  // up the morphed nodes, but trigger an extra immediate pass too in case the
  // morph reuses existing cards in place.
  queueMicrotask(syncAll);
});

const observer = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    for (const node of mutation.addedNodes) {
      if (!(node instanceof Element)) continue;
      if (node.matches?.(CARD_SELECTOR)) syncCard(node);
      else syncAll(node);
    }
  }
});

observer.observe(document.body, { childList: true, subtree: true });
