/**
 * Sampler Six — Flavor Picker (Custom Dropdowns)
 *
 * Manages 6 custom combobox dropdowns with coffee images/descriptions.
 * Keeps hidden line item property inputs synced inside the product form
 * so properties are present when the theme serializes FormData for AJAX
 * add-to-cart.
 */

class SamplerFlavorPicker extends HTMLElement {
  /** @type {HTMLElement[]} */
  #dropdowns = [];

  /** @type {HTMLElement | null} */
  #errorEl = null;

  /** @type {HTMLFormElement | null} */
  #productForm = null;

  /** @type {{ title: string, image: string, description: string, available: boolean }[]} */
  #coffees = [];

  /** Index of the currently focused option within an open listbox (-1 = none) */
  #focusedIndex = -1;

  connectedCallback() {
    this.#dropdowns = [...this.querySelectorAll('.sampler-picker__dropdown')];
    this.#errorEl = this.querySelector('.sampler-picker__error');

    // Parse coffee data
    const dataScript = document.querySelector('script[data-sampler-coffees]');
    if (dataScript) {
      try {
        this.#coffees = JSON.parse(dataScript.textContent);
      } catch { /* options will be empty */ }
    }

    // Find the product form
    const section = this.closest('[data-section-id], .shopify-section, .section');
    this.#productForm =
      section?.querySelector('form[data-type="add-to-cart-form"]')
      ?? document.querySelector('product-form-component form[data-type="add-to-cart-form"]')
      ?? document.querySelector('form[data-type="add-to-cart-form"]')
      ?? null;

    // Render option lists and bind events
    this.#renderListboxes();
    this.#bindEvents();

    if (this.#productForm) {
      this.#productForm.addEventListener('submit', this.#handleSubmit, { capture: true });
    }

    this.#syncHiddenInputs();
    this.#syncButtonState();
  }

  disconnectedCallback() {
    document.removeEventListener('click', this.#handleOutsideClick);
    document.removeEventListener('keydown', this.#handleKeydown);

    if (this.#productForm) {
      this.#productForm.removeEventListener('submit', this.#handleSubmit, { capture: true });
    }

    this.#productForm
      ?.querySelectorAll('input[data-sampler-property]')
      .forEach((el) => el.remove());
  }

  // ---------------------------------------------------------------------------
  // Selections
  // ---------------------------------------------------------------------------

  /** @returns {string[]} Currently selected flavor values (may contain empty strings). */
  get #selections() {
    return this.#dropdowns.map((d) => d.dataset.value || '');
  }

  /** @returns {boolean} True when all 6 slots have a selection. */
  get #isComplete() {
    return this.#selections.every((v) => v !== '');
  }

  // ---------------------------------------------------------------------------
  // Rendering
  // ---------------------------------------------------------------------------

  /** Populate each listbox with option markup from the coffee data. */
  #renderListboxes() {
    this.#dropdowns.forEach((dropdown) => {
      const listbox = dropdown.querySelector('[role="listbox"]');
      if (!listbox || this.#coffees.length === 0) return;

      const flavorIndex = dropdown.dataset.flavorIndex;
      listbox.innerHTML = this.#coffees.map((coffee, i) => {
        const disabled = !coffee.available;
        const soldOutSuffix = disabled ? ' (Sold out)' : '';
        return `
          <li role="option"
            class="sampler-picker__option"
            data-value="${this.#escAttr(coffee.title)}"
            aria-selected="false"
            aria-disabled="${disabled}"
            id="sampler-opt-${flavorIndex}-${i}">
            <img class="sampler-picker__option-img"
              src="${this.#escAttr(coffee.image)}"
              alt="" width="40" height="40" loading="lazy">
            <div class="sampler-picker__option-text">
              <span class="sampler-picker__option-title">${this.#escHTML(coffee.title)}${soldOutSuffix}</span>
              <span class="sampler-picker__option-desc">${this.#escHTML(coffee.description)}</span>
            </div>
          </li>`;
      }).join('');
    });
  }

  // ---------------------------------------------------------------------------
  // Events
  // ---------------------------------------------------------------------------

  #bindEvents() {
    // Trigger clicks
    this.#dropdowns.forEach((dropdown) => {
      const trigger = dropdown.querySelector('.sampler-picker__trigger');
      trigger?.addEventListener('click', () => this.#toggleDropdown(dropdown));
    });

    // Option clicks (delegated)
    this.addEventListener('click', (e) => {
      const option = e.target.closest('.sampler-picker__option');
      if (!option || option.getAttribute('aria-disabled') === 'true') return;
      const dropdown = option.closest('.sampler-picker__dropdown');
      if (dropdown) this.#selectOption(dropdown, option.dataset.value);
    });

    // Outside click & keyboard
    document.addEventListener('click', this.#handleOutsideClick);
    document.addEventListener('keydown', this.#handleKeydown);
  }

  #handleOutsideClick = (e) => {
    if (!this.contains(e.target)) {
      this.#closeAll();
    }
  };

  #handleKeydown = (e) => {
    const openDropdown = this.#dropdowns.find(
      (d) => d.querySelector('.sampler-picker__trigger')?.getAttribute('aria-expanded') === 'true'
    );

    if (!openDropdown) return;

    const listbox = openDropdown.querySelector('[role="listbox"]');
    const options = [...(listbox?.querySelectorAll('.sampler-picker__option') ?? [])];
    if (options.length === 0) return;

    switch (e.key) {
      case 'Escape':
        e.preventDefault();
        this.#closeDropdown(openDropdown);
        openDropdown.querySelector('.sampler-picker__trigger')?.focus();
        break;

      case 'ArrowDown':
        e.preventDefault();
        this.#moveFocus(options, 1, openDropdown);
        break;

      case 'ArrowUp':
        e.preventDefault();
        this.#moveFocus(options, -1, openDropdown);
        break;

      case 'Home': {
        e.preventDefault();
        const firstEnabled = options.findIndex((o) => o.getAttribute('aria-disabled') !== 'true');
        if (firstEnabled >= 0) this.#setFocus(options, firstEnabled, openDropdown);
        break;
      }

      case 'End': {
        e.preventDefault();
        let lastEnabled = -1;
        for (let i = options.length - 1; i >= 0; i--) {
          if (options[i].getAttribute('aria-disabled') !== 'true') { lastEnabled = i; break; }
        }
        if (lastEnabled >= 0) this.#setFocus(options, lastEnabled, openDropdown);
        break;
      }

      case 'Enter':
        e.preventDefault();
        if (this.#focusedIndex >= 0 && this.#focusedIndex < options.length) {
          const opt = options[this.#focusedIndex];
          if (opt.getAttribute('aria-disabled') !== 'true') {
            this.#selectOption(openDropdown, opt.dataset.value);
          }
        }
        break;

      case 'Tab':
        this.#closeDropdown(openDropdown);
        break;
    }
  };

  // ---------------------------------------------------------------------------
  // Dropdown open / close
  // ---------------------------------------------------------------------------

  #toggleDropdown(dropdown) {
    const trigger = dropdown.querySelector('.sampler-picker__trigger');
    const isOpen = trigger?.getAttribute('aria-expanded') === 'true';
    if (isOpen) {
      this.#closeDropdown(dropdown);
    } else {
      this.#closeAll();
      this.#openDropdown(dropdown);
    }
  }

  #openDropdown(dropdown) {
    const trigger = dropdown.querySelector('.sampler-picker__trigger');
    const listbox = dropdown.querySelector('[role="listbox"]');
    if (!trigger || !listbox) return;

    trigger.setAttribute('aria-expanded', 'true');
    listbox.hidden = false;
    this.#focusedIndex = -1;

    // Highlight currently selected option
    const currentValue = dropdown.dataset.value;
    if (currentValue) {
      const options = [...listbox.querySelectorAll('.sampler-picker__option')];
      const idx = options.findIndex((o) => o.dataset.value === currentValue);
      if (idx >= 0) {
        this.#setFocus(options, idx, dropdown);
        // Scroll selected into view
        options[idx].scrollIntoView({ block: 'nearest' });
      }
    }
  }

  #closeDropdown(dropdown) {
    const trigger = dropdown.querySelector('.sampler-picker__trigger');
    const listbox = dropdown.querySelector('[role="listbox"]');
    if (!trigger || !listbox) return;

    trigger.setAttribute('aria-expanded', 'false');
    trigger.removeAttribute('aria-activedescendant');
    listbox.hidden = true;
    this.#focusedIndex = -1;

    // Clear focused state
    listbox.querySelectorAll('[data-focused]').forEach((el) => delete el.dataset.focused);
  }

  #closeAll() {
    this.#dropdowns.forEach((d) => this.#closeDropdown(d));
  }

  // ---------------------------------------------------------------------------
  // Focus management (keyboard navigation)
  // ---------------------------------------------------------------------------

  #moveFocus(options, direction, dropdown) {
    let next = this.#focusedIndex + direction;
    // Skip disabled options
    while (next >= 0 && next < options.length && options[next].getAttribute('aria-disabled') === 'true') {
      next += direction;
    }
    if (next >= 0 && next < options.length) {
      this.#setFocus(options, next, dropdown);
    }
  }

  #setFocus(options, index, dropdown) {
    // Clear previous
    options.forEach((o) => delete o.dataset.focused);

    this.#focusedIndex = index;
    const opt = options[index];
    if (!opt) return;

    opt.dataset.focused = 'true';
    opt.scrollIntoView({ block: 'nearest' });

    const trigger = dropdown.querySelector('.sampler-picker__trigger');
    trigger?.setAttribute('aria-activedescendant', opt.id);
  }

  // ---------------------------------------------------------------------------
  // Selection
  // ---------------------------------------------------------------------------

  #selectOption(dropdown, value) {
    const listbox = dropdown.querySelector('[role="listbox"]');

    // Update aria-selected
    listbox?.querySelectorAll('.sampler-picker__option').forEach((opt) => {
      opt.setAttribute('aria-selected', (opt.dataset.value === value).toString());
    });

    // Store value
    dropdown.dataset.value = value;

    // Update trigger to show thumbnail + title
    const trigger = dropdown.querySelector('.sampler-picker__trigger');
    const textSpan = trigger?.querySelector('.sampler-picker__trigger-text');
    const coffee = this.#coffees.find((c) => c.title === value);

    if (trigger && textSpan && coffee) {
      // Remove old thumbnail if any
      trigger.querySelector('.sampler-picker__trigger-thumb')?.remove();

      if (coffee.image) {
        const img = document.createElement('img');
        img.className = 'sampler-picker__trigger-thumb';
        img.src = coffee.image;
        img.alt = '';
        img.width = 24;
        img.height = 24;
        img.loading = 'lazy';
        trigger.insertBefore(img, textSpan);
      }

      textSpan.textContent = coffee.title;
    }

    // Mark slot as filled
    const slot = dropdown.closest('[data-slot]');
    if (slot) slot.dataset.filled = 'true';
    dropdown.dataset.filled = '';

    this.#closeDropdown(dropdown);
    trigger?.focus();

    // Hide error once all filled
    if (this.#isComplete && this.#errorEl) {
      this.#errorEl.hidden = true;
    }

    this.#syncHiddenInputs();
    this.#syncButtonState();
  }

  // ---------------------------------------------------------------------------
  // Hidden inputs & button state
  // ---------------------------------------------------------------------------

  #syncHiddenInputs() {
    if (!this.#productForm) return;

    this.#selections.forEach((value, i) => {
      const name = `properties[Flavor ${i + 1}]`;
      let input = this.#productForm.querySelector(`input[data-sampler-property][data-flavor="${i}"]`);

      if (value) {
        if (!input) {
          input = document.createElement('input');
          input.type = 'hidden';
          input.name = name;
          input.setAttribute('data-sampler-property', '');
          input.setAttribute('data-flavor', String(i));
          this.#productForm.appendChild(input);
        }
        input.value = value;
      } else if (input) {
        input.remove();
      }
    });
  }

  #syncButtonState() {
    if (!this.#productForm) return;
    const btn = this.#productForm.querySelector('[name="add"], button[type="submit"]');
    if (!btn) return;

    if (this.#isComplete) {
      btn.removeAttribute('data-sampler-disabled');
      if (btn.dataset.samplerWasDisabled === 'false' || !btn.hasAttribute('data-sampler-init')) {
        btn.removeAttribute('disabled');
      }
    } else {
      if (!btn.hasAttribute('data-sampler-init')) {
        btn.dataset.samplerWasDisabled = btn.disabled.toString();
        btn.setAttribute('data-sampler-init', '');
      }
      btn.setAttribute('data-sampler-disabled', '');
      btn.disabled = true;
    }
  }

  #handleSubmit = (event) => {
    if (!this.#isComplete) {
      event.preventDefault();
      event.stopImmediatePropagation();
      if (this.#errorEl) {
        this.#errorEl.hidden = false;
      }
      // Focus first empty dropdown trigger
      const firstEmpty = this.#dropdowns.find((d) => !d.dataset.value);
      firstEmpty?.querySelector('.sampler-picker__trigger')?.focus();
    }
  };

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  #escAttr(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  #escHTML(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
}

if (!customElements.get('sampler-flavor-picker')) {
  customElements.define('sampler-flavor-picker', SamplerFlavorPicker);
}
