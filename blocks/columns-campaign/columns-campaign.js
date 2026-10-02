/**
 * Campaign columns: intro (heading, text, CTA) | stack of linked panels.
 * Authored as 1 row x 2 cells. In the panels cell, each heading starts a new
 * panel; the heading's link becomes the whole-panel link and a decorative
 * arrow bar is appended.
 * @param {Element} block The block element
 */

const isHeading = (node) => /^H[1-6]$/.test(node.tagName);

/**
 * A paragraph holding nothing but one link (how AEM authoring stores a linked heading).
 * @param {Element} node cell child
 */
const isLinkOnly = (node) => node.tagName === 'P'
  && node.children.length === 1
  && node.firstElementChild.tagName === 'A'
  && node.textContent.trim() === node.firstElementChild.textContent.trim();

/**
 * Restores panel titles as headings when they arrive as link-only paragraphs:
 * AEM authoring turns a heading that only holds a link into a plain link.
 * @param {Element} cell panels cell
 */
function restoreLinkedHeadings(cell) {
  const nodes = [...cell.children];
  if (nodes.some(isHeading)) return;
  nodes.filter(isLinkOnly).forEach((p) => {
    const heading = document.createElement('h2');
    const link = p.firstElementChild;
    link.className = '';
    heading.append(link);
    p.replaceWith(heading);
  });
}

function buildPanels(cell) {
  restoreLinkedHeadings(cell);
  const nodes = [...cell.children];
  if (!nodes.some(isHeading)) return;

  const panels = [];
  let current = null;
  nodes.forEach((node) => {
    if (isHeading(node) || !current) {
      current = document.createElement('div');
      current.className = 'columns-campaign-pane-body';
      panels.push(current);
    }
    current.append(node);
  });

  cell.replaceChildren();
  panels.forEach((body) => {
    const panel = document.createElement('div');
    panel.className = 'columns-campaign-pane';
    const link = body.querySelector('h1 a, h2 a, h3 a, h4 a, h5 a, h6 a') || body.querySelector('a[href]');
    if (link) {
      panel.classList.add('columns-campaign-linked');
      link.classList.remove('button');
    }
    const arrow = document.createElement('span');
    arrow.className = 'columns-campaign-arrow';
    arrow.setAttribute('aria-hidden', 'true');
    panel.append(body, arrow);
    cell.append(panel);
  });
  cell.classList.add('columns-campaign-panes');
}

export default function decorate(block) {
  const firstRow = block.firstElementChild;
  if (!firstRow) return;
  block.classList.add(`columns-campaign-${firstRow.children.length}-cols`);

  [...block.children].forEach((row) => {
    const cells = [...row.children];
    cells.forEach((cell, i) => {
      if (i === 0) cell.classList.add('columns-campaign-intro');
      else buildPanels(cell);
    });
  });
}
