/**
 * Story columns: feature story (heading, image, text, CTA) | panel of promo items.
 * Authored as 1 row x 2 cells. In the second cell each image starts a new
 * item: [thumbnail | title, text, link].
 * @param {Element} block The block element
 */

const isImageNode = (node) => node.tagName === 'PICTURE'
  || (node.querySelector?.('picture') && !node.textContent.trim());

function buildItems(cell) {
  const nodes = [...cell.children];
  if (!nodes.some(isImageNode)) return;

  const items = [];
  let current = null;
  nodes.forEach((node) => {
    if (isImageNode(node) || !current) {
      current = { media: null, body: document.createElement('div') };
      items.push(current);
    }
    if (isImageNode(node) && !current.media) current.media = node;
    else current.body.append(node);
  });

  cell.replaceChildren();
  items.forEach(({ media, body }) => {
    const item = document.createElement('div');
    item.className = 'columns-story-item';
    if (media) {
      const mediaWrap = document.createElement('div');
      mediaWrap.className = 'columns-story-item-image';
      mediaWrap.append(media);
      item.append(mediaWrap);
    } else {
      item.classList.add('columns-story-item-no-image');
    }
    body.className = 'columns-story-item-body';
    item.append(body);
    cell.append(item);
  });
  cell.classList.add('columns-story-list');
}

export default function decorate(block) {
  const firstRow = block.firstElementChild;
  if (!firstRow) return;
  block.classList.add(`columns-story-${firstRow.children.length}-cols`);

  [...block.children].forEach((row) => {
    [...row.children].forEach((cell, i) => {
      if (i === 0) cell.classList.add('columns-story-feature');
      else buildItems(cell);
    });
  });
}
