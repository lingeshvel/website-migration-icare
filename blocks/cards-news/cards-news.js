import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * News teasers: first card with an image is rendered as a featured card
 * (image background, text overlay, spans two columns); remaining cards are text-only.
 * Each row: [image (optional) | date/tag, title, excerpt, "Read more" link].
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
        cell.className = 'cards-news-card-image';
      } else if (!cell.textContent.trim()) {
        cell.remove();
      } else {
        cell.className = 'cards-news-card-body';
      }
    });

    const body = li.querySelector('.cards-news-card-body');
    if (body) {
      // first short paragraph before the title is the date / tag line
      const first = body.firstElementChild;
      if (first && first.tagName === 'P' && first.nextElementSibling?.matches('h1, h2, h3, h4, h5, h6')) {
        first.classList.add('cards-news-card-meta');
      }
      body.querySelectorAll('a.button').forEach((a) => a.classList.remove('button'));
    }

    if (li.querySelector('.cards-news-card-image')) li.classList.add('cards-news-has-image');
    ul.append(li);
  });

  const featured = ul.querySelector(':scope > li.cards-news-has-image');
  if (featured && featured === ul.firstElementChild) featured.classList.add('cards-news-featured');

  ul.querySelectorAll('picture > img').forEach((img) => {
    const optimized = createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]);
    moveInstrumentation(img, optimized.querySelector('img'));
    img.closest('picture').replaceWith(optimized);
  });

  block.replaceChildren(ul);
}
