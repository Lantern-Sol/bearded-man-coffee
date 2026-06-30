/**
 * Sampler Six — Flavor Picker (Dropdowns)
 *
 * Manages 6 flavor dropdowns and keeps hidden line item property inputs
 * synced inside the product form at all times. This ensures the properties
 * are already present when the theme's product-form-component serializes
 * the FormData for its AJAX add-to-cart request.
 */

class SamplerFlavorPicker extends HTMLElement {
  /** @type {HTMLSelectElement[]} */
  #selects = [];

  /** @type {HTMLElement | null} */
  #errorEl = null;

  /** @type {HTMLFormElement | null} */
  #productForm = null;

  connectedCallback() {
    this.#selects = [...this.querySelectorAll('select[data-flavor-index]')];
    this.#errorEl = this.querySelector('.sampler-picker__error');

    // Find the product form — walk up to the section wrapper first,
    // then fall back to the nearest product-form-component on the page.
    const section = this.closest('[data-section-id], .shopify-section, .section');
    this.#productForm =
      section?.querySelector('form[data-type="add-to-cart-form"]')
      ?? document.querySelector('product-form-component form[data-type="add-to-cart-form"]')
      ?? document.querySelector('form[data-type="add-to-cart-form"]')
      ?? null;

    this.#selects.forEach((select) => {
      select.addEventListener('change', this.#handleChange);
    });

    if (this.#productForm) {
      this.#productForm.addEventListener('submit', this.#handleSubmit, { capture: true });
    }

    // Create the hidden inputs in the form immediately
    this.#syncHiddenInputs();
    this.#syncButtonState();
  }

  disconnectedCallback() {
    this.#selects.forEach((select) => {
      select.removeEventListener('change', this.#handleChange);
    });

    if (this.#productForm) {
      this.#productForm.removeEventListener('submit', this.#handleSubmit, { capture: true });
    }

    // Clean up injected inputs
    this.#productForm
      ?.querySelectorAll('input[data-sampler-property]')
      .forEach((el) => el.remove());
  }

  /** @returns {string[]} Currently selected flavor values (may contain empty strings). */
  get #selections() {
    return this.#selects.map((s) => s.value);
  }

  /** @returns {boolean} True when all 6 slots have a selection. */
  get #isComplete() {
    return this.#selections.every((v) => v !== '');
  }

  #handleChange = () => {
    // Mark filled slots for visual feedback
    this.#selects.forEach((select) => {
      const slot = select.closest('[data-slot]');
      if (slot) {
        slot.dataset.filled = (select.value !== '').toString();
      }
    });

    // Hide error once all filled
    if (this.#isComplete && this.#errorEl) {
      this.#errorEl.hidden = true;
    }

    // Keep hidden inputs in sync on every change
    this.#syncHiddenInputs();
    this.#syncButtonState();
  };

  /**
   * Create or update hidden inputs inside the product form so they're
   * always part of the FormData when the theme serializes it.
   */
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
        // Remove empty selections so incomplete properties don't leak
        input.remove();
      }
    });
  }

  /**
   * Enable/disable the add-to-cart button based on selection completeness.
   */
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

  /**
   * Block submission if selections are incomplete.
   * Uses capture phase to run before the theme's handler.
   * @param {SubmitEvent} event
   */
  #handleSubmit = (event) => {
    if (!this.#isComplete) {
      event.preventDefault();
      event.stopImmediatePropagation();
      if (this.#errorEl) {
        this.#errorEl.hidden = false;
      }
      const firstEmpty = this.#selects.find((s) => s.value === '');
      firstEmpty?.focus();
    }
  };
}

if (!customElements.get('sampler-flavor-picker')) {
  customElements.define('sampler-flavor-picker', SamplerFlavorPicker);
}
