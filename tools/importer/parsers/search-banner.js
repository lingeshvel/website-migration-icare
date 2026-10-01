/* eslint-disable */
/* global WebImporter */
/**
 * Parser for search-banner. Base: search. Source: https://www.icare.nsw.gov.au/
 * Model (blocks/search-banner/_search-banner.json): label (text), source (aem-content).
 * Rows: [label], [source link]. The source site's search is a JS form with no
 * crawlable endpoint, so the source row points at the EDS /query-index.json
 * (decorator renders results inline for *.json sources).
 */
export default function parse(element, { document }) {
  const labelEl = element.querySelector('.search-box-headding, .hero-serach-headding, label, [class*="heading"], [class*="headding"]');
  const labelText = (labelEl && labelEl.textContent.trim()) || 'How can we help?';

  const form = element.querySelector('form[action]');
  const action = form && form.getAttribute('action');
  const sourceHref = action && action !== '#' ? action : '/query-index.json';

  const cells = [];

  // Row 1: label
  const labelCell = document.createDocumentFragment();
  labelCell.appendChild(document.createComment(' field:label '));
  labelCell.appendChild(document.createTextNode(labelText));
  cells.push([labelCell]);

  // Row 2: source (query index / search results page)
  const sourceCell = document.createDocumentFragment();
  const link = document.createElement('a');
  link.href = sourceHref;
  link.textContent = sourceHref;
  sourceCell.appendChild(document.createComment(' field:source '));
  sourceCell.appendChild(link);
  cells.push([sourceCell]);

  const block = WebImporter.Blocks.createBlock(document, { name: 'search-banner', cells });
  element.replaceWith(block);
}
