/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards-audience. Base: cards. Source: https://www.icare.nsw.gov.au/
 * Model (cards-audience-card): image (+imageAlt collapsed), text (richtext: linked title).
 * Each row: [icon image | linked heading].
 * Iterates the inner .tab-content wrappers (not the sibling <a> tiles) so that
 * html2md's adjacent-anchor merging cannot collapse the tiles; href is read
 * from the enclosing anchor. The decorative arrow icon is dropped.
 */
export default function parse(element, { document }) {
  let items = Array.from(element.querySelectorAll('.tab-content')).map((body) => ({
    body,
    link: body.closest('a[href]'),
  }));
  if (!items.length) {
    items = Array.from(element.querySelectorAll(':scope > a.cm-home-tile, :scope > a[href]'))
      .map((a) => ({ body: a, link: a }));
  }

  const cells = [];
  items.forEach(({ body, link }) => {
    const icon = Array.from(body.querySelectorAll('img'))
      .find((img) => !img.closest('.home-tile-link'));
    const headingEl = body.querySelector('.tile-headding, h2, h3, h4');
    const title = headingEl ? headingEl.textContent.trim() : '';
    if (!icon && !title) return;

    const imageCell = document.createDocumentFragment();
    if (icon) {
      const img = document.createElement('img');
      img.src = icon.getAttribute('src');
      img.alt = icon.getAttribute('alt') || '';
      imageCell.appendChild(document.createComment(' field:image '));
      imageCell.appendChild(img);
    }

    const textCell = document.createDocumentFragment();
    if (title) {
      const h = document.createElement(headingEl && /^H[1-6]$/.test(headingEl.tagName) ? headingEl.tagName.toLowerCase() : 'h2');
      const href = link && link.getAttribute('href');
      if (href) {
        const a = document.createElement('a');
        a.href = href;
        a.textContent = title;
        h.appendChild(a);
      } else {
        h.textContent = title;
      }
      textCell.appendChild(document.createComment(' field:text '));
      textCell.appendChild(h);
    }

    cells.push([imageCell, textCell]);
  });

  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-audience', cells });
  element.replaceWith(block);
}
