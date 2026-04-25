import { ThemeEvents } from '@theme/events';
import { Component } from '@theme/component';

/**
 * Roast Profile component.
 *
 * Listens for variant update events emitted by the variant picker and
 * swaps in the new server-rendered content for the matching block id.
 * Only meaningful when the metafield source is variant-scoped; product-scoped
 * metafields don't change with variant selection but the listener is harmless.
 *
 * @extends {Component}
 */
class RoastProfile extends Component {
  connectedCallback() {
    super.connectedCallback();
    const closestSection = this.closest('.shopify-section, dialog');
    if (!closestSection) return;
    closestSection.addEventListener(ThemeEvents.variantUpdate, this.update);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    const closestSection = this.closest('.shopify-section, dialog');
    if (!closestSection) return;
    closestSection.removeEventListener(ThemeEvents.variantUpdate, this.update);
  }

  /**
   * @param {Event} event - The variant update event.
   */
  update = (event) => {
    /** @type {any} */
    const variantEvent = event;
    const detail = variantEvent.detail;
    if (!detail?.data?.html) return;

    if (detail.data.newProduct) {
      this.dataset.productId = detail.data.newProduct.id;
    } else if (
      variantEvent.target instanceof HTMLElement &&
      variantEvent.target.dataset.productId &&
      variantEvent.target.dataset.productId !== this.dataset.productId
    ) {
      return;
    }

    const newEl = detail.data.html.querySelector(
      `roast-profile[data-block-id="${this.dataset.blockId}"]`
    );
    if (!newEl) return;

    const fragment = document.createDocumentFragment();
    Array.from(newEl.cloneNode(true).childNodes).forEach((node) => fragment.appendChild(node));
    this.replaceChildren(fragment);
  };
}

if (!customElements.get('roast-profile')) {
  customElements.define('roast-profile', RoastProfile);
}
