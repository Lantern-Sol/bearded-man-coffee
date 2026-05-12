import { ThemeEvents, CartAddEvent, CartUpdateEvent } from '@theme/events';
import { fetchConfig } from '@theme/utilities';

class CartDrawerUpsell extends HTMLElement {
  #abortController = null;
  #attrObserver = null;
  #childObserver = null;
  #fetchInFlight = false;
  #lastFetchedProductId = null;

  connectedCallback() {
    this.#fetchRecommendation();

    // Re-fetch when data-product-id changes (cart morph updates the attribute).
    this.#attrObserver = new MutationObserver(() => {
      if (this.dataset.productId !== this.#lastFetchedProductId) {
        this.#fetchRecommendation();
      }
    });
    this.#attrObserver.observe(this, { attributes: true, attributeFilter: ['data-product-id'] });

    // Hydration / section morph can replace our injected card with the server-rendered
    // placeholder. Detect that and re-inject from cache or re-fetch.
    this.#childObserver = new MutationObserver(() => {
      if (this.#fetchInFlight) return;
      const hasCard = this.querySelector('.cart-drawer-upsell__card');
      const hasPlaceholder = this.querySelector('.cart-drawer-upsell__placeholder');
      if (!hasCard && hasPlaceholder && this.dataset.productId) {
        this.#fetchRecommendation();
      }
    });
    this.#childObserver.observe(this, { childList: true });

    this.addEventListener('click', this.#handleAddClick);
  }

  disconnectedCallback() {
    this.#abortController?.abort();
    this.#attrObserver?.disconnect();
    this.#childObserver?.disconnect();
    this.removeEventListener('click', this.#handleAddClick);
  }

  async #fetchRecommendation() {
    const productId = this.dataset.productId;
    const sectionId = this.dataset.sectionId || 'cart-drawer-upsell';

    if (!productId) {
      this.replaceChildren();
      return;
    }

    this.#abortController?.abort();
    this.#abortController = new AbortController();
    this.#fetchInFlight = true;
    this.#lastFetchedProductId = productId;

    const url = `/recommendations/products?section_id=${encodeURIComponent(
      sectionId
    )}&product_id=${encodeURIComponent(productId)}&intent=related&limit=1`;

    try {
      const response = await fetch(url, { signal: this.#abortController.signal });
      if (!response.ok) {
        this.replaceChildren();
        return;
      }
      const html = await response.text();
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const card = doc.querySelector('.cart-drawer-upsell__card');
      if (card) {
        this.replaceChildren(card);
      } else {
        this.replaceChildren();
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('cart-drawer-upsell fetch failed', error);
      }
    } finally {
      this.#fetchInFlight = false;
    }
  }

  #handleAddClick = async (event) => {
    const button = /** @type {HTMLElement|null} */ (event.target)?.closest?.('[data-cart-drawer-upsell-add]');
    if (!button) return;

    event.preventDefault();
    if (button.hasAttribute('disabled') || button.dataset.busy === '1') return;

    const variantId = button.dataset.variantId;
    const productId = button.dataset.productId;
    if (!variantId) return;

    button.dataset.busy = '1';
    button.setAttribute('disabled', '');

    // Build FormData manually rather than `new FormData(form)`. No <form> on the
    // page = no `form[action*="cart/add"]` for 3rd-party widgets (Appstle, etc.)
    // to mistake for the product form.
    const formData = new FormData();
    formData.set('id', variantId);
    formData.set('quantity', '1');

    const cartItemsComponents = document.querySelectorAll('cart-items-component');
    const sectionIds = [];
    cartItemsComponents.forEach((item) => {
      if (item instanceof HTMLElement && item.dataset.sectionId) {
        sectionIds.push(item.dataset.sectionId);
      }
    });
    if (sectionIds.length) {
      formData.set('sections', sectionIds.join(','));
    }

    const cfg = fetchConfig('javascript', { body: formData });
    cfg.headers.Accept = 'text/html';

    try {
      const response = await fetch(Theme.routes.cart_add_url, cfg);
      const data = await response.json();

      this.dispatchEvent(
        new CartAddEvent({}, productId || '', {
          source: 'cart-drawer-upsell',
          itemCount: 1,
          productId,
          sections: data.sections,
        })
      );

      document.dispatchEvent(
        new CartUpdateEvent(data, productId || '', {
          source: 'cart-drawer-upsell',
          itemCount: 1,
          sections: data.sections,
        })
      );
    } catch (error) {
      console.error('cart-drawer-upsell add failed', error);
    } finally {
      button.removeAttribute('disabled');
      delete button.dataset.busy;
    }
  };
}

if (!customElements.get('cart-drawer-upsell')) {
  customElements.define('cart-drawer-upsell', CartDrawerUpsell);
}
