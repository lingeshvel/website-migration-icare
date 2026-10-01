/* eslint-disable */
/* global WebImporter */
/**
 * Parser for columns-story. Base: columns. Source: https://www.icare.nsw.gov.au/
 * Columns block (xwalk): no field hints. 1 row x 2 cells.
 *   Cell 1: feature story - H2, image, text, "Find out more" CTA.
 *   Cell 2: promo items - per item: image, H3 title, text, "Find out more" link.
 *           The decorator starts a new item at each image.
 * Items iterated via .paralympic-right-section block wrappers.
 */
export default function parse(element, { document }) {
  const makeImg = (src) => {
    if (!src) return null;
    const img = document.createElement('img');
    img.src = src.getAttribute('src');
    img.alt = src.getAttribute('alt') || '';
    return img;
  };
  const makeLinkP = (a) => {
    if (!a) return null;
    const p = document.createElement('p');
    const link = document.createElement('a');
    link.href = a.getAttribute('href');
    link.textContent = a.textContent.trim();
    p.appendChild(link);
    return p;
  };
  const textP = (text) => {
    const p = document.createElement('p');
    p.textContent = text;
    return p;
  };

  // Cell 1: feature story
  const feature = element.querySelector('.content-paralympic')
    || element.querySelector(':scope > .sl-item:not(.paralympic-right)');
  const featureCell = [];
  if (feature) {
    const heading = feature.querySelector('h1, h2, h3, .story-title');
    if (heading) {
      const h2 = document.createElement('h2');
      h2.textContent = heading.textContent.trim();
      featureCell.push(h2);
    }
    const img = makeImg(feature.querySelector('.paralympic-left-image, img'));
    if (img) featureCell.push(img);
    const textEl = feature.querySelector('.paralympic-text');
    if (textEl) {
      const paras = Array.from(textEl.querySelectorAll('p'));
      if (paras.length) paras.forEach((p) => featureCell.push(textP(p.textContent.trim())));
      else if (textEl.textContent.trim()) featureCell.push(textP(textEl.textContent.trim()));
    }
    const cta = makeLinkP(feature.querySelector('a.cta, a[href]'));
    if (cta) featureCell.push(cta);
  }

  // Cell 2: promo items
  const listCell = [];
  element.querySelectorAll('.paralympic-right-section').forEach((section) => {
    const img = makeImg(section.querySelector('img'));
    if (img) listCell.push(img);
    const headline = section.querySelector('.paralympic-headline, h3, h4');
    if (headline) {
      const h3 = document.createElement('h3');
      h3.textContent = headline.textContent.trim();
      listCell.push(h3);
    }
    const body = section.querySelector('.paralympic-multi-text') || section;
    Array.from(body.querySelectorAll('p'))
      .filter((p) => !p.querySelector('a') && p.textContent.trim())
      .forEach((p) => listCell.push(textP(p.textContent.trim())));
    const link = makeLinkP(body.querySelector('a[href]'));
    if (link) listCell.push(link);
  });

  if (!featureCell.length && !listCell.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [[featureCell.length ? featureCell : '', listCell.length ? listCell : '']];
  const block = WebImporter.Blocks.createBlock(document, { name: 'columns-story', cells });
  element.replaceWith(block);
}
