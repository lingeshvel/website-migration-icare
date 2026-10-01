/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards-news. Base: cards. Source: https://www.icare.nsw.gov.au/
 * Model (cards-news-card): image (+imageAlt collapsed), text (richtext).
 * Each row: [image (featured card only) | meta (tag + date), H3 title, excerpt, "Read more" link].
 * Items iterated via .sl-item block wrappers (not the inner card <a>); href read
 * from the card anchor. Featured card image may be an <img> or a CSS
 * background-image (inline style / data attribute) - both emitted as <img>.
 */
function extractBgUrl(el) {
  if (!el) return null;
  const candidates = [el, ...el.querySelectorAll('[style], [data-src], [data-bg], [data-background], [data-background-image]')];
  for (const node of candidates) {
    const style = node.getAttribute('style') || '';
    const m = style.match(/background(?:-image)?\s*:[^;]*url\(\s*['"]?([^'")]+)['"]?\s*\)/i);
    if (m) return m[1];
    const data = node.getAttribute('data-bg') || node.getAttribute('data-background')
      || node.getAttribute('data-background-image') || node.getAttribute('data-src');
    if (data) {
      const dm = data.match(/url\(\s*['"]?([^'")]+)['"]?\s*\)/i);
      return dm ? dm[1] : data;
    }
  }
  return null;
}

export default function parse(element, { document }) {
  let items = Array.from(element.querySelectorAll('.sl-list > .sl-item'));
  if (!items.length) items = Array.from(element.querySelectorAll('section.cm'));

  const cells = [];
  items.forEach((item) => {
    const content = item.querySelector('.content') || item;
    const heading = content.querySelector('h1, h2, h3, h4');
    const title = heading ? heading.textContent.trim() : '';
    const link = item.querySelector('a[href]');
    const href = link ? link.getAttribute('href') : null;
    if (!title && !href) return;

    // Image cell: featured card background (img or CSS background)
    const imageCell = document.createDocumentFragment();
    const bg = item.querySelector('.module-background, [class*="background"]');
    let imgSrc = null;
    let imgAlt = '';
    const bgImg = bg ? bg.querySelector('img') : null;
    if (bgImg && bgImg.getAttribute('src')) {
      imgSrc = bgImg.getAttribute('src');
      imgAlt = bgImg.getAttribute('alt') || '';
    } else {
      imgSrc = extractBgUrl(bg) || (item.classList && extractBgUrl(item.querySelector('section.cm-featured-content-module')));
    }
    if (imgSrc) {
      const img = document.createElement('img');
      img.src = imgSrc;
      img.alt = imgAlt || title;
      imageCell.appendChild(document.createComment(' field:image '));
      imageCell.appendChild(img);
    }

    // Text cell
    const textCell = document.createDocumentFragment();
    textCell.appendChild(document.createComment(' field:text '));

    const sub = content.querySelector('.subheading');
    if (sub) {
      const type = (sub.querySelector('.content-type')?.textContent || '').trim();
      const date = (sub.querySelector('.subtitle')?.textContent || '').trim();
      if (type || date) {
        const meta = document.createElement('p');
        if (type) {
          const strong = document.createElement('strong');
          strong.textContent = type;
          meta.appendChild(strong);
          if (date) meta.appendChild(document.createTextNode(' '));
        }
        if (date) meta.appendChild(document.createTextNode(date));
        textCell.appendChild(meta);
      }
    }

    if (title) {
      const h3 = document.createElement('h3');
      h3.textContent = title;
      textCell.appendChild(h3);
    }

    Array.from(content.querySelectorAll('p'))
      .filter((p) => !p.classList.contains('subheading') && p.textContent.trim())
      .forEach((p) => {
        const np = document.createElement('p');
        np.textContent = p.textContent.trim();
        textCell.appendChild(np);
      });

    if (href) {
      const ctaText = (content.querySelector('.faux-link')?.textContent || '').trim() || 'Read more';
      const p = document.createElement('p');
      const a = document.createElement('a');
      a.href = href;
      a.textContent = ctaText;
      p.appendChild(a);
      textCell.appendChild(p);
    }

    cells.push([imageCell, textCell]);
  });

  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-news', cells });
  element.replaceWith(block);
}
