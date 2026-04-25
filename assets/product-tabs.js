import { Component } from '@theme/component';

/**
 * Product Tabs component.
 *
 * Discovers panels from `_tab` blocks rendered as direct children of the
 * `[ref="panels"]` container. Each panel carries its label on
 * `data-tab-label` and the tab nav is built at runtime from that data.
 *
 * @typedef {object} Refs
 * @property {HTMLElement} tablist
 * @property {HTMLElement} panels
 *
 * @extends Component<Refs>
 */
class ProductTabs extends Component {
  requiredRefs = ['tablist', 'panels'];

  /** @type {HTMLElement[]} */
  #panels = [];
  /** @type {HTMLButtonElement[]} */
  #tabs = [];

  connectedCallback() {
    super.connectedCallback();
    this.#hydrate();
    this.setAttribute('data-hydrated', '');
  }

  updatedCallback() {
    super.updatedCallback();
    this.#hydrate();
  }

  #hydrate() {
    const { panels, tablist } = this.refs;
    if (!panels || !tablist) return;

    const previouslyActiveLabel = this.#tabs.find((tab) => tab.getAttribute('aria-selected') === 'true')?.textContent;

    this.#panels = /** @type {HTMLElement[]} */ (
      Array.from(panels.querySelectorAll(':scope > .product-tabs__panel'))
    );

    tablist.replaceChildren();
    this.#tabs = this.#panels.map((panel, index) => {
      const label = panel.dataset.tabLabel || `Tab ${index + 1}`;
      const tab = document.createElement('button');
      tab.type = 'button';
      tab.className = 'product-tabs__tab';
      tab.setAttribute('role', 'tab');
      tab.textContent = label;
      tab.addEventListener('click', () => this.#activate(index));
      tab.addEventListener('keydown', (event) => this.#onKeydown(event));
      tablist.appendChild(tab);
      return tab;
    });

    let activeIndex = 0;
    if (previouslyActiveLabel) {
      const restoredIndex = this.#tabs.findIndex((tab) => tab.textContent === previouslyActiveLabel);
      if (restoredIndex !== -1) activeIndex = restoredIndex;
    }
    this.#activate(activeIndex);
  }

  /**
   * @param {number} index
   */
  #activate(index) {
    if (index < 0 || index >= this.#tabs.length) return;

    this.#tabs.forEach((tab, i) => {
      const selected = i === index;
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
    });

    this.#panels.forEach((panel, i) => {
      panel.toggleAttribute('hidden', i !== index);
    });
  }

  /**
   * @param {KeyboardEvent} event
   */
  #onKeydown(event) {
    if (!this.#tabs.length) return;
    const currentIndex = this.#tabs.findIndex((tab) => tab === document.activeElement);
    if (currentIndex === -1) return;

    let nextIndex = currentIndex;
    switch (event.key) {
      case 'ArrowRight':
        nextIndex = (currentIndex + 1) % this.#tabs.length;
        break;
      case 'ArrowLeft':
        nextIndex = (currentIndex - 1 + this.#tabs.length) % this.#tabs.length;
        break;
      case 'Home':
        nextIndex = 0;
        break;
      case 'End':
        nextIndex = this.#tabs.length - 1;
        break;
      default:
        return;
    }

    event.preventDefault();
    this.#activate(nextIndex);
    this.#tabs[nextIndex]?.focus();
  }
}

if (!customElements.get('product-tabs')) {
  customElements.define('product-tabs', ProductTabs);
}
