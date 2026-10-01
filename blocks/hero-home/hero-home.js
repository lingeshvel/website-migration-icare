import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * Homepage hero: text panel (H1 + subheading) beside / over a full-bleed image.
 * Authored rows: [image] then [richtext]. Either row may be omitted.
 * @param {Element} block The block element
 */
export default function decorate(block) {
  const media = document.createElement('div');
  media.className = 'hero-home-media';
  const content = document.createElement('div');
  content.className = 'hero-home-content';

  [...block.children].forEach((row) => {
    const pic = row.querySelector('picture');
    const hasText = [...row.querySelectorAll('h1, h2, h3, h4, h5, h6, p')]
      .some((el) => el.textContent.trim() && !el.querySelector('picture'));

    if (pic && !hasText) {
      const img = pic.querySelector('img');
      if (img) {
        const optimized = createOptimizedPicture(img.src, img.alt, true, [
          { media: '(min-width: 900px)', width: '2000' },
          { width: '900' },
        ]);
        moveInstrumentation(img, optimized.querySelector('img'));
        pic.replaceWith(optimized);
      }
      moveInstrumentation(row, media);
      media.append(...row.querySelectorAll('picture'));
    } else {
      const cells = row.children.length ? [...row.children] : [row];
      cells.forEach((cell) => content.append(...cell.childNodes));
      if (!content.dataset.aueResource) moveInstrumentation(row, content);
    }
  });

  block.replaceChildren();
  if (content.childElementCount) block.append(content);
  if (media.childElementCount) block.append(media);
  else block.classList.add('no-image');
}
