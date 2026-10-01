/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: icare (www.icare.nsw.gov.au, Sitecore XM Cloud / Next.js) site-wide cleanup.
 * All selectors verified in migration-work/cleaned.html.
 */
const TransformHook = { beforeTransform: 'beforeTransform', afterTransform: 'afterTransform' };

/**
 * "I want to..." quick links (section.cta-long-wrapper .cta-long-section).
 * Source: two div.col-2 columns, each with div.cta-coloumn-headding > h2 (second h2 empty)
 * and a.cta-long tiles (text in span.tile-headding, decorative img.imageArrow).
 * Output (default content): <h2>I want to...</h2><ul><li><a>..</a></li>...</ul>
 */
function normalizeCtaLong(element, document) {
  element.querySelectorAll('.cta-long-section').forEach((ctaSection) => {
    const links = [...ctaSection.querySelectorAll('a.cta-long')];
    if (!links.length) return;

    const heading = [...ctaSection.querySelectorAll('.cta-coloumn-headding h2')]
      .find((h) => h.textContent.trim());

    const ul = document.createElement('ul');
    links.forEach((link) => {
      const labelEl = link.querySelector('span.tile-headding');
      const text = (labelEl ? labelEl.textContent : link.textContent).trim();
      if (!text) return;
      const a = document.createElement('a');
      a.href = link.getAttribute('href');
      a.textContent = text;
      const li = document.createElement('li');
      li.append(a);
      ul.append(li);
    });

    ctaSection.textContent = '';
    if (heading) {
      const h2 = document.createElement('h2');
      h2.textContent = heading.textContent.trim();
      ctaSection.append(h2);
    }
    ctaSection.append(ul);
  });
}

/**
 * Next.js image optimizer URLs (/_next/image?url=<encoded original>&w=..&q=..).
 * Replace with the original media URL so the image resolves outside the Next.js app
 * (e.g. hero: /_next/image?url=https%3A%2F%2Fedge.sitecorecloud.io%2F...png).
 */
function unwrapNextImages(element) {
  element.querySelectorAll('img').forEach((img) => {
    const src = img.getAttribute('src') || '';
    if (!src.includes('/_next/image')) return;
    try {
      const original = new URL(src, 'https://www.icare.nsw.gov.au').searchParams.get('url');
      if (original) {
        img.setAttribute('src', new URL(original, 'https://www.icare.nsw.gov.au').href);
        img.removeAttribute('srcset');
      }
    } catch (e) {
      // leave src untouched if it cannot be parsed
    }
  });
}

/**
 * Source pill CTAs (a.cta): a.cta.is-secondary = outlined, other a.cta = filled primary.
 * EDS decorateButtons only buttonizes links wrapped in <em> (secondary) or <strong> (primary).
 */
function markCtaButtons(element, document) {
  element.querySelectorAll('a.cta').forEach((a) => {
    if (a.closest('strong, em') || a.querySelector('img')) return;
    const wrapper = document.createElement(a.classList.contains('is-secondary') ? 'em' : 'strong');
    a.replaceWith(wrapper);
    wrapper.append(a);
  });
}

export default function transform(hookName, element, payload) {
  const document = element.ownerDocument;

  if (hookName === TransformHook.beforeTransform) {
    unwrapNextImages(element);
    markCtaButtons(element, document);

    WebImporter.DOMUtils.remove(element, [
      // Inline styles/scripts (e.g. <style> tags inside the .ck-content rich-text container)
      'style',
      'script',
      'noscript',
      // Floating "Your feedback" widget (section#main-feedback) + its overlay + reCAPTCHA
      '#main-feedback',
      '.feedback-overlay',
      '.grecaptcha-badge',
      // Google Translate widget (div.skiptranslate, #goog-gt-tt, VIpgJd-* containers/iframes)
      '.skiptranslate',
      '#goog-gt-tt',
      '.VIpgJd-ZVi9od-aZ2wEe-wOHMyf',
      // Multilingual disclaimer modal
      '.modal-container',
      // Hidden duplicate mobile hero (second .l-padding with duplicate h1 + image)
      'section.homepage-hero-banner > .l-padding.show-on-mobile',
      // Visually-hidden duplicate hero title text next to hero image
      'section.homepage-hero-banner .image-container span.vh',
      // Decorative separators inside the story module; would otherwise become section breaks
      'hr.paralympic-separation',
    ]);
  }

  if (hookName === TransformHook.afterTransform) {
    // "I want to..." tiles -> h2 + list of plain links (default content)
    normalizeCtaLong(element, document);

    WebImporter.DOMUtils.remove(element, [
      // Global chrome
      'header.global-header',
      'footer.global-footer',
      '#global-search',
      '.primary-offscreen-container',
      '.shade-bg',
      // Skip links
      'ul#top.accessibility-links',
      // Next.js / Sitecore runtime elements
      'next-route-announcer',
      'byoc-registration',
      // Leftovers
      'iframe',
      'link',
      'noscript',
      'style',
      'script',
    ]);
  }
}
