/*
 * Footer block
 *
 * Reads the authored footer fragment (content/footer.plain.html) and renders:
 *   - a columns row: every section that contains links becomes a column
 *     (brand/logo column, link-list columns, icon-link/social column)
 *   - a bottom bar: trailing sections without links (e.g. copyright)
 * An <h2> in the fragment is kept as the footer's visually hidden landmark heading.
 * All copy and media come from the fragment; this file only builds layout and behaviour.
 */

/**
 * Fetches the footer fragment (metadata independent: /content first, then site root).
 * @returns {Promise<{html: string, url: string}|null>}
 */
async function fetchFooterFragment() {
  // the /content/ fragment only exists in local preview, where pages are served under /content/
  const local = window.location.pathname.startsWith('/content/');
  let url = '/content/footer.plain.html';
  let resp = local ? await fetch('/content/footer.plain.html') : { ok: false };
  if (!resp.ok) {
    url = '/footer.plain.html';
    resp = await fetch('/footer.plain.html');
  }
  if (!resp.ok) return null;
  return { html: await resp.text(), url };
}

/**
 * Resolves relative image paths against the fragment location so they work on any page.
 * @param {Element} root fragment root
 * @param {string} fragmentUrl URL the fragment was fetched from
 */
function resolveImagePaths(root, fragmentUrl) {
  const base = new URL(fragmentUrl, window.location.origin);
  root.querySelectorAll('img').forEach((img) => {
    const src = img.getAttribute('src');
    if (src && !/^(https?:|data:|\/)/.test(src)) img.src = new URL(src, base).href;
    img.loading = 'lazy';
  });
}

/**
 * Icon-only links pointing to another origin open in a new tab.
 * @param {Element} root container
 */
function decorateIconLinks(root) {
  root.querySelectorAll('a[href]').forEach((a) => {
    const iconOnly = a.querySelector('img, .footer-icon') && !a.textContent.trim();
    const external = new URL(a.href, window.location.href).origin !== window.location.origin;
    if (iconOnly && external) {
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
    }
  });
}

/**
 * Renders icon-list images (e.g. social icons) as sized background icons, as on the source:
 * the image alt becomes the link's accessible name, the image URL comes from the fragment.
 * @param {Element} column icon column
 */
function renderIconImages(column) {
  column.querySelectorAll('li a img').forEach((img) => {
    const a = img.closest('a');
    const icon = document.createElement('span');
    icon.className = 'footer-icon';
    // landscape images (e.g. the LinkedIn mark) get a wider box, as on the source
    const ratio = Number(img.getAttribute('width')) / Number(img.getAttribute('height'));
    if (ratio > 1.05) icon.classList.add('footer-icon-wide');
    icon.setAttribute('aria-hidden', 'true');
    icon.style.backgroundImage = `url("${img.currentSrc || img.src}")`;
    if (img.alt) a.setAttribute('aria-label', img.alt);
    (img.closest('picture') || img).replaceWith(icon);
  });
}

/**
 * Links an authored logo: AEM authoring turns a paragraph holding only a link into a button
 * (dropping any image inside it), so the logo is authored as an image paragraph followed by
 * a home link paragraph. The image is moved into the link; its alt text names the link.
 * @param {Element} section fragment section
 */
function linkLogo(section) {
  if (section.querySelector('ul')) return;
  const images = [...section.querySelectorAll('img')].filter((img) => !img.closest('a'));
  const links = [...section.querySelectorAll('a[href]')];
  if (images.length !== 1 || links.length !== 1) return;
  const [img] = images;
  const [link] = links;
  const media = img.closest('picture') || img;
  const holder = media.parentElement;
  if (img.alt) link.setAttribute('aria-label', img.alt);
  link.replaceChildren(media);
  if (holder && holder !== section && !holder.children.length && !holder.textContent.trim()) {
    holder.remove();
  }
}

/**
 * Assigns a presentational role to a fragment section based on its content.
 * @param {Element} section fragment section
 * @returns {string} column modifier
 */
function getColumnType(section) {
  const links = [...section.querySelectorAll('a')];
  if (links.length && links.every((a) => a.querySelector('img') && !a.textContent.trim())) {
    return section.querySelector('ul') ? 'icons' : 'brand';
  }
  return 'links';
}

/**
 * Builds the footer layout from the fragment sections.
 * @param {Element} fragment parsed fragment root
 * @returns {Element} footer content
 */
function buildFooter(fragment) {
  const sections = [...fragment.children].filter((el) => el.tagName === 'DIV');
  const main = document.createElement('div');
  main.className = 'footer-main';

  const heading = fragment.querySelector('h2');
  if (heading) {
    heading.id = 'footer-heading';
    heading.className = 'footer-heading';
    main.append(heading);
  }

  const nav = document.createElement('nav');
  nav.className = 'footer-nav';
  if (heading) nav.setAttribute('aria-labelledby', heading.id);
  const columns = document.createElement('div');
  columns.className = 'footer-columns';
  nav.append(columns);
  main.append(nav);

  const bottom = document.createElement('div');
  bottom.className = 'footer-bottom';
  const bottomInner = document.createElement('div');
  bottomInner.className = 'footer-bottom-inner';
  bottom.append(bottomInner);

  sections.forEach((section) => {
    const hasLinks = !!section.querySelector('a');
    if (!hasLinks) {
      bottomInner.append(...section.childNodes);
      return;
    }
    const column = document.createElement('div');
    linkLogo(section);
    const type = getColumnType(section);
    column.className = `footer-column footer-column-${type}`;
    column.append(...section.childNodes);
    if (type === 'icons') renderIconImages(column);
    columns.append(column);
  });

  const wrapper = document.createElement('div');
  wrapper.append(main);
  if (bottomInner.children.length) wrapper.append(bottom);
  return wrapper;
}

/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  const fragment = await fetchFooterFragment();
  block.textContent = '';
  if (!fragment) return;

  const root = document.createElement('div');
  root.innerHTML = fragment.html;
  resolveImagePaths(root, fragment.url);

  const footer = buildFooter(root);
  decorateIconLinks(footer);
  block.append(...footer.children);
}
