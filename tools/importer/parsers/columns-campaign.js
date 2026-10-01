/* eslint-disable */
/* global WebImporter */
/**
 * Parser for columns-campaign. Base: columns. Source: https://www.icare.nsw.gov.au/
 * Columns block (xwalk): no field hints. 1 row x 2 cells.
 *   Cell 1: intro - heading, paragraph, CTA link.
 *   Cell 2: linked panels - per panel an H3 wrapping the panel link + paragraph.
 * Panels are iterated via the inner .campaign-secondary wrappers (not the sibling
 * <a> links) so html2md's anchor merging cannot collapse them; href comes from
 * the enclosing anchor.
 */
export default function parse(element, { document }) {
  const items = Array.from(element.querySelectorAll(':scope > .sl-item'));
  const primary = element.querySelector('.campaign-primary') || items[0];
  const secondaryScope = items[1] || element;

  // Cell 1: intro
  const introCell = [];
  if (primary) {
    const heading = primary.querySelector('h1, h2, h3, h4');
    if (heading) {
      const h2 = document.createElement('h2');
      h2.textContent = heading.textContent.trim();
      introCell.push(h2);
    }
    Array.from(primary.querySelectorAll('p'))
      .filter((p) => p.textContent.trim())
      .forEach((p) => introCell.push(p));
    const cta = primary.querySelector('a.cta, a[href]');
    if (cta) {
      const p = document.createElement('p');
      const a = document.createElement('a');
      a.href = cta.getAttribute('href');
      a.textContent = cta.textContent.trim();
      if (cta.getAttribute('title')) a.title = cta.getAttribute('title');
      p.appendChild(a);
      introCell.push(p);
    }
  }

  // Cell 2: linked panels
  let panels = Array.from(secondaryScope.querySelectorAll('.campaign-secondary'));
  if (!panels.length) {
    panels = Array.from(secondaryScope.querySelectorAll('a.cm-image-block-link'));
  }
  const panelCell = [];
  panels.forEach((panel) => {
    const link = panel.closest('a[href]') || panel.querySelector('a[href]');
    const heading = panel.querySelector('h1, h2, h3, h4');
    const title = heading ? heading.textContent.trim() : '';
    if (title) {
      // keep the source heading level (panels are h2 on the source page)
      const panelHeading = document.createElement(heading.tagName.toLowerCase());
      if (link) {
        const a = document.createElement('a');
        a.href = link.getAttribute('href');
        a.textContent = title;
        panelHeading.appendChild(a);
      } else {
        panelHeading.textContent = title;
      }
      panelCell.push(panelHeading);
    }
    Array.from(panel.querySelectorAll('p'))
      .filter((p) => p.textContent.trim())
      .forEach((p) => {
        const np = document.createElement('p');
        np.textContent = p.textContent.trim();
        panelCell.push(np);
      });
  });

  if (!introCell.length && !panelCell.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [[introCell, panelCell.length ? panelCell : '']];
  const block = WebImporter.Blocks.createBlock(document, { name: 'columns-campaign', cells });
  element.replaceWith(block);
}
