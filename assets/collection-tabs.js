import { Component } from '@theme/component';

/**
 * Tabbed collection grids with optional dot indicators.
 *
 * Panels are discovered from direct `.collection-grid-block` children
 * because each `_collection-grid` block renders itself via the shared
 * `{% content_for 'blocks' %}` call — we can't add `ref` attributes to
 * blocks the section doesn't render directly.
 *
 * @typedef {object} Refs
 * @property {HTMLElement} tablist
 * @property {HTMLButtonElement[]} tabs
 * @property {HTMLButtonElement[]} [dots]
 *
 * @extends Component<Refs>
 */
class CollectionTabsComponent extends Component {
  requiredRefs = ['tablist', 'tabs'];

  /** @type {HTMLElement[]} */
  #panels = [];

  connectedCallback() {
    super.connectedCallback();
    this.#hydratePanels();
    this.setAttribute('data-hydrated', '');
  }

  updatedCallback() {
    super.updatedCallback();
    this.#hydratePanels();
  }

  #hydratePanels() {
    this.#panels = /** @type {HTMLElement[]} */ (
      Array.from(this.querySelectorAll(':scope > .collection-grid-block'))
    );

    const { tabs } = this.refs;

    this.#panels.forEach((panel, i) => {
      panel.setAttribute('role', 'tabpanel');

      if (!panel.id) {
        panel.id = `collection-panel-${this.dataset.sectionId ?? 'tabs'}-${i}`;
      }

      const tab = tabs?.[i];
      if (tab) {
        tab.setAttribute('aria-controls', panel.id);
        if (tab.id) panel.setAttribute('aria-labelledby', tab.id);
      }

      if (i === 0) {
        panel.removeAttribute('hidden');
      } else {
        panel.setAttribute('hidden', '');
      }
    });
  }

  /**
   * @param {{ value: string }} data
   */
  select(data) {
    const index = Number(data?.value);
    if (!Number.isFinite(index)) return;
    this.#activate(index);
  }

  /**
   * @param {KeyboardEvent} event
   */
  onTabKeydown(event) {
    const { tabs } = this.refs;
    if (!tabs?.length) return;

    const currentIndex = tabs.findIndex((tab) => tab === document.activeElement);
    if (currentIndex === -1) return;

    let nextIndex = currentIndex;

    switch (event.key) {
      case 'ArrowRight':
        nextIndex = (currentIndex + 1) % tabs.length;
        break;
      case 'ArrowLeft':
        nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
        break;
      case 'Home':
        nextIndex = 0;
        break;
      case 'End':
        nextIndex = tabs.length - 1;
        break;
      default:
        return;
    }

    event.preventDefault();
    this.#activate(nextIndex);
    tabs[nextIndex]?.focus();
  }

  /**
   * @param {number} index
   */
  #activate(index) {
    const { tabs, dots } = this.refs;
    if (!tabs?.length || !this.#panels.length) return;
    if (index < 0 || index >= tabs.length) return;

    tabs.forEach((tab, i) => {
      const selected = i === index;
      tab.setAttribute('aria-selected', String(selected));
      tab.setAttribute('tabindex', selected ? '0' : '-1');
    });

    this.#panels.forEach((panel, i) => {
      if (i === index) {
        panel.removeAttribute('hidden');
      } else {
        panel.setAttribute('hidden', '');
      }
    });

    if (Array.isArray(dots)) {
      dots.forEach((dot, i) => {
        dot.setAttribute('aria-selected', String(i === index));
      });
    }
  }
}

if (!customElements.get('collection-tabs-component')) {
  customElements.define('collection-tabs-component', CollectionTabsComponent);
}
