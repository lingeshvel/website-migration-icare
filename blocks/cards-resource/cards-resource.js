import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * Resource hub cards: icon + title + description + CTA link, 3-column grid.
 * Each row: [icon image | title, text, link].
 * @param {Element} block The block element
 */
export default function decorate(block) {
  const ul = document.createElement('ul');

  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    moveInstrumentation(row, li);
    while (row.firstElementChild) li.append(row.firstElementChild);

    [...li.children].forEach((cell) => {
      if (cell.querySelector('picture') && !cell.textContent.trim()) {
        cell.className = 'cards-resource-card-image';
      } else if (!cell.textContent.trim()) {
        cell.remove();
      } else {
        cell.className = 'cards-resource-card-body';
      }
    });

    const links = li.querySelectorAll('.cards-resource-card-body a[href]');
    if (links.length) {
      const cta = links[links.length - 1];
      cta.classList.remove('button');
      cta.closest('p')?.classList.add('cards-resource-card-cta');
    }

    ul.append(li);
  });

  ul.querySelectorAll('picture > img').forEach((img) => {
    const optimized = createOptimizedPicture(img.src, img.alt, false, [{ width: '160' }]);
    moveInstrumentation(img, optimized.querySelector('img'));
    img.closest('picture').replaceWith(optimized);
  });

  block.replaceChildren(ul);
}
