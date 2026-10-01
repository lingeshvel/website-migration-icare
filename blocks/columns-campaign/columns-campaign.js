/**
 * Campaign columns: intro (heading, text, CTA) | stack of linked panels.
 * Authored as 1 row x 2 cells. In the panels cell, each heading starts a new
 * panel; the heading's link becomes the whole-panel link and a decorative
 * arrow bar is appended.
 * @param {Element} block The block element
 */

function buildPanels(cell) {
  const nodes = [...cell.children];
  if (!nodes.some((n) => /^H[1-6]$/.test(n.tagName))) return;

  const panels = [];
  let current = null;
  nodes.forEach((node) => {
    if (/^H[1-6]$/.test(node.tagName) || !current) {
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
