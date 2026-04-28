import { Slideshow } from '@theme/slideshow';

/**
 * Slideshow variant that auto-tags arbitrary direct children of its
 * <slideshow-slides> as slides — so any block (group columns, product
 * cards, etc.) can be a slide without each block needing slideshow-aware
 * markup.
 *
 * Children are wrapped in <slideshow-slide ref="slides[]"> on connect,
 * which is what the parent Slideshow class expects in its `refs.slides`.
 *
 * @extends {Slideshow}
 */
export class AutoSlideshow extends Slideshow {
  connectedCallback() {
    this.#wrapChildrenAsSlides();
    super.connectedCallback();
  }

  #wrapChildrenAsSlides() {
    const scroller = this.querySelector(':scope > slideshow-container > slideshow-slides');
    if (!scroller) return;

    const children = Array.from(scroller.children);
    children.forEach((child, index) => {
      if (child.tagName.toLowerCase() === 'slideshow-slide') return;

      const slide = document.createElement('slideshow-slide');
      slide.setAttribute('ref', 'slides[]');
      slide.setAttribute('aria-hidden', index === 0 ? 'false' : 'true');
      slide.setAttribute('slide-id', `auto-slide-${index}`);
      slide.style.setProperty('--slideshow-timeline', `--slide-${index}`);

      child.replaceWith(slide);
      slide.appendChild(child);
    });
  }
}

if (!customElements.get('slideshow-auto-component')) {
  customElements.define('slideshow-auto-component', AutoSlideshow);
}
