/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards-resource. Base: cards. Source: https://www.icare.nsw.gov.au/
 * Model (cards-resource-card): image (+imageAlt collapsed), text (richtext).
 * Each row: [icon image | H3 title, description, CTA link].
 * Cards are keyed on the inner .icare-resource-title headings (paired by index with
 * icons/bodies/CTAs) rather than the sibling <a> cards, so html2md anchor merging
 * cannot collapse them. The href is read from each heading's enclosing anchor.
 */
export default function parse(element, { document }) {
  const titles = Array.from(element.querySelectorAll('.icare-resource-title, h3'));
  const allCards = Array.from(element.querySelectorAll('a.icare-resource-card'));

  const cells = [];
  titles.forEach((titleEl, i) => {
    const card = titleEl.closest('a.icare-resource-card, a[href]') || allCards[i] || null;
    const scope = card && card.querySelectorAll('.icare-resource-title, h3').length === 1 ? card : null;
    const pick = (sel) => (scope ? scope.querySelector(sel) : element.querySelectorAll(sel)[i]);

    const icon = pick('.icare-resource-icon img');
    const body = pick('.icare-resource-body');
    const cta = pick('.icare-resource-cta');
    const href = allCards[i]?.getAttribute('href') || card?.getAttribute('href');
    const title = titleEl.textContent.trim();
    if (!title) return;

    const imageCell = document.createDocumentFragment();
    if (icon) {
      const img = document.createElement('img');
      // html2md rewrites bare ".../*icons/name.svg" srcs to :icon: tokens (EDS /icons
      // convention), which would drop the asset. Adding the Sitecore no-op query
      // (?iar=0, as used by the audience tiles) keeps it as a real image reference.
      let src = icon.getAttribute('src') || '';
      // Live page uses root-relative "/-/media/..." srcs; make them absolute.
      if (!/^https?:\/\//i.test(src)) {
        try { src = new URL(src, 'https://www.icare.nsw.gov.au/').href; } catch (e) { /* keep as-is */ }
      }
      if (/\.svg$/i.test(src)) src += '?iar=0';
      img.src = src;
      img.alt = icon.getAttribute('alt') || `${title} icon`;
      imageCell.appendChild(document.createComment(' field:image '));
      imageCell.appendChild(img);
    }

    const textCell = document.createDocumentFragment();
    textCell.appendChild(document.createComment(' field:text '));
    const h3 = document.createElement('h3');
    h3.textContent = title;
    textCell.appendChild(h3);
    if (body && body.textContent.trim()) {
      const p = document.createElement('p');
      p.textContent = body.textContent.trim();
      textCell.appendChild(p);
    }
    if (href) {
      const ctaLabel = cta?.querySelector('span:not(.icare-resource-cta-icon)')?.textContent.trim()
        || 'Explore hub';
      const p = document.createElement('p');
      const a = document.createElement('a');
      a.href = href;
      a.textContent = ctaLabel;
      p.appendChild(a);
      textCell.appendChild(p);
    }

    cells.push([imageCell, textCell]);
  });

  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-resource', cells });
  element.replaceWith(block);
}
