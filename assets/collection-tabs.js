import { Component } from '@theme/component';

/**
 * Tabbed collection grids.
 *
 * Panels are discovered from direct `.collection-grid-block` children. Each
 * panel carries its tab label on `data-tab-label`, so the tab nav is built
 * at runtime from that data — avoiding the Liquid limitation that
 * `content_for 'block'` cannot take a dynamic `id`, which prevented us from
 * iterating + rendering blocks server-side.
 *
 * Pagination dots (when enabled) live inside each panel's own slideshow
 * (the slider mode of `_collection-grid`), so only the active panel's
 * dots are visible — and they track the active product card slide rather
 * than the active tab.
 *
 * @typedef {object} Refs
 * @property {HTMLElement} tablist
 * @property {HTMLElement} [emptyState]
 *
 * @extends Component<Refs>
 */
class CollectionTabsComponent extends Component {
  requiredRefs = ['tablist'];

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
    this.#hydratePanels();
    this.#buildTabs();
    this.#toggleEmptyState();
  }

  #toggleEmptyState() {
    const hasPanels = this.#panels.length > 0;
    const { tablist, emptyState } = this.refs;
    if (emptyState) emptyState.toggleAttribute('hidden', hasPanels);
    if (tablist) tablist.toggleAttribute('hidden', !hasPanels);
  }

  #hydratePanels() {
    this.#panels = /** @type {HTMLElement[]} */ (
      Array.from(this.querySelectorAll(':scope > .collection-grid-block'))
    );
    const sectionId = this.dataset.sectionId ?? 'tabs';
    this.#panels.forEach((panel, i) => {
      panel.setAttribute('role', 'tabpanel');
      if (!panel.id) {
        panel.id = `collection-panel-${sectionId}-${i}`;
      }
      if (i === 0) panel.removeAttribute('hidden');
      else panel.setAttribute('hidden', '');
    });
  }

  #buildTabs() {
    const tablist = this.refs.tablist;
    if (!tablist) return;
    tablist.replaceChildren();
    const sectionId = this.dataset.sectionId ?? 'tabs';
    this.#tabs = this.#panels.map((panel, i) => {
      const label = panel.dataset.tabLabel || `Tab ${i + 1}`;
      const tab = document.createElement('button');
      tab.type = 'button';
      tab.className = 'collection-tabs__tab h6';
      tab.setAttribute('role', 'tab');
      tab.id = `collection-tab-${sectionId}-${i}`;
      tab.setAttribute('aria-controls', panel.id);
      tab.setAttribute('aria-selected', i === 0 ? 'true' : 'false');
      tab.tabIndex = i === 0 ? 0 : -1;
      tab.textContent = label;
      panel.setAttribute('aria-labelledby', tab.id);
      tab.addEventListener('click', () => this.#activate(i));
      tab.addEventListener('keydown', (event) => this.#onTabKeydown(event));
      tablist.appendChild(tab);
      return tab;
    });
  }

  /**
   * @param {KeyboardEvent} event
   */
  #onTabKeydown(event) {
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
      if (i === index) panel.removeAttribute('hidden');
      else panel.setAttribute('hidden', '');
    });
  }
}

if (!customElements.get('collection-tabs-component')) {
  customElements.define('collection-tabs-component', CollectionTabsComponent);
}
