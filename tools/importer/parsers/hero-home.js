/* eslint-disable */
/* global WebImporter */
/**
 * Parser for hero-home. Base: hero. Source: https://www.icare.nsw.gov.au/
 * Model (blocks/hero-home/_hero-home.json): image (+imageAlt collapsed), text (richtext).
 * Rows: [image], [text]. Source duplicates content for desktop (.show-on-full-width)
 * and mobile (.show-on-mobile); only the desktop copy is used to avoid duplicates.
 */
export default function parse(element, { document }) {
  const scope = element.querySelector(':scope > .show-on-full-width')
    || element.querySelector(':scope > .l-padding')
    || element;

  const image = scope.querySelector('.image-container img, img');
  const heading = scope.querySelector('.content h1, .content h2, h1, h2');
  const content = scope.querySelector('.content') || scope;
  const paragraphs = Array.from(content.querySelectorAll(':scope > p'))
    .filter((p) => p.textContent.trim());

  if (!image && !heading && !paragraphs.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [];

  // Row 1: image (reference) - alt collapsed into the img attribute
  const imageCell = document.createDocumentFragment();
  if (image) {
    const img = document.createElement('img');
    img.src = image.getAttribute('src');
    img.alt = image.getAttribute('alt') || '';
    imageCell.appendChild(document.createComment(' field:image '));
    imageCell.appendChild(img);
  }
  cells.push([imageCell]);

  // Row 2: text (richtext) - heading + subheading
  const textCell = document.createDocumentFragment();
  if (heading || paragraphs.length) {
    textCell.appendChild(document.createComment(' field:text '));
    if (heading) textCell.appendChild(heading);
    paragraphs.forEach((p) => textCell.appendChild(p));
  }
  cells.push([textCell]);

  const block = WebImporter.Blocks.createBlock(document, { name: 'hero-home', cells });
  element.replaceWith(block);
}
