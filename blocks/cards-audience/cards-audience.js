import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * Audience tiles: grid of whole-tile links, each with icon + title + decorative arrow.
 * Each row: [icon image | title (heading or paragraph) wrapped in a link].
 * @param {Element} block The block element
 */
export default function decorate(block) {
  const ul = document.createElement('ul');

  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    moveInstrumentation(row, li);
    while (row.firstElementChild) li.append(row.firstElementChild);

    [...li.children].forEach((cell) => {
      const onlyPicture = cell.children.length === 1 && cell.querySelector('picture');
      if (onlyPicture) cell.className = 'cards-audience-card-image';
      else if (!cell.textContent.trim() && !cell.querySelector('picture')) cell.remove();
      else cell.className = 'cards-audience-card-body';
    });

    const link = li.querySelector('.cards-audience-card-body a[href]');
    if (link) {
      li.classList.add('cards-audience-linked');
      link.classList.remove('button');
      link.closest('.button-container')?.classList.remove('button-container');
    }

    const arrow = document.createElement('span');
    arrow.className = 'cards-audience-arrow';
    arrow.setAttribute('aria-hidden', 'true');
    li.append(arrow);

    ul.append(li);
  });

  ul.querySelectorAll('picture > img').forEach((img) => {
    const optimized = createOptimizedPicture(img.src, img.alt, false, [{ width: '160' }]);
    moveInstrumentation(img, optimized.querySelector('img'));
    img.closest('picture').replaceWith(optimized);
  });

  block.replaceChildren(ul);
}
