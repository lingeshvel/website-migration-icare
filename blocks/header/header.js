/*
 * Header block
 *
 * Reads the authored nav fragment (content/nav.plain.html) and renders:
 *   desktop (>= 900px)
 *     row 0 – brand, utility links (incl. language selector), search toggle, login toggle
 *     row 1 – primary navigation with click-driven three-column megamenus
 *   mobile (< 900px)
 *     centered brand bar + fixed bottom toolbar (menu, search, links); the menu slides
 *     up from the bottom and drills down with slide-in panels (login accordion on top)
 *
 * Fragment contract (top-level section divs):
 *   - sections starting with an <h2> are megamenu panels:
 *       <h2>Trigger</h2> <p>accessible trigger label</p>
 *       <ul><li><a href="#">Category</a> <ul>links</ul>
 *                [<p>Tasks heading</p> <ul>task links</ul>]
 *                [<p>accessible category label</p>]</li></ul>
 *       <p>close button label</p>
 *   - the remaining sections, in order: brand, utility links, search, login,
 *     mobile (1st list = toolbar: menu label, search label, links; 2nd list = in-menu links)
 * All copy comes from the fragment; this file only builds controls and behaviour.
 */

const isDesktop = window.matchMedia('(min-width: 900px)');

const NAV_PATHS = ['/content/nav.plain.html', '/nav.plain.html'];

/**
 * Fetches the nav fragment (metadata independent: /content first, then site root).
 * @returns {Promise<{html: string, url: string}|null>}
 */
async function fetchNavFragment() {
  let url = NAV_PATHS[0];
  let resp = await fetch('/content/nav.plain.html');
  if (!resp.ok) {
    [, url] = NAV_PATHS;
    resp = await fetch('/nav.plain.html');
  }
  if (!resp.ok) return null;
  return { html: await resp.text(), url };
}

function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  Object.entries(attrs).forEach(([key, value]) => {
    if (value === undefined || value === null || value === false) return;
    if (key === 'className') node.className = value;
    else node.setAttribute(key, value === true ? '' : value);
  });
  children.flat().forEach((child) => {
    if (child === undefined || child === null) return;
    node.append(typeof child === 'string' ? document.createTextNode(child) : child);
  });
  return node;
}

function srOnly(label) {
  return el('span', { className: 'nav-sr-only' }, label);
}

function text(node) {
  return node ? node.textContent.replace(/\s+/g, ' ').trim() : '';
}

function ownText(node) {
  return [...node.childNodes]
    .filter((n) => n.nodeType === Node.TEXT_NODE || (n.nodeType === Node.ELEMENT_NODE && n.tagName !== 'UL'))
    .map((n) => n.textContent).join(' ').replace(/\s+/g, ' ')
    .trim();
}

function externalize(link) {
  if (/^https?:/.test(link.getAttribute('href') || '')) {
    link.target = '_blank';
    link.rel = 'noopener';
  }
  return link;
}

/**
 * Appends a visually hidden accessible suffix to a control.
 * If the authored label extends the visible text, the extra part is appended as
 * visually hidden text; otherwise the label becomes the aria-label.
 */
function applyAccessibleLabel(control, visible, label) {
  if (!label || label === visible) return;
  if (label.startsWith(visible)) {
    control.append(srOnly(label.slice(visible.length)));
  } else {
    control.setAttribute('aria-label', label);
  }
}

function resolveImages(root, fragmentUrl) {
  const base = new URL(fragmentUrl, window.location.origin);
  root.querySelectorAll('img').forEach((img) => {
    const src = img.getAttribute('src');
    if (src && !/^(https?:|data:|\/)/.test(src)) img.src = new URL(src, base).href;
    img.loading = 'eager';
  });
}

/* ---------- shared open/close state ---------- */

function getHeader(control) {
  return control.closest('.header');
}

function searchToggles(block) {
  return block.querySelectorAll('[aria-controls="nav-search"]');
}

function setShade(block) {
  const searchOpen = !!block.querySelector('[aria-controls="nav-search"][aria-expanded="true"]');
  const menuOpen = isDesktop.matches && !!block.querySelector('.nav-trigger[aria-expanded="true"]');
  block.classList.toggle('nav-shade-active', searchOpen || menuOpen);
  block.classList.toggle('nav-search-active', searchOpen);
}

function resetDrill(panel) {
  panel.classList.remove('is-drilled');
  if (!isDesktop.matches) {
    panel.querySelectorAll('.nav-category-title').forEach((b) => b.setAttribute('aria-expanded', 'false'));
  }
}

function closeMegamenus(block, except) {
  block.querySelectorAll('.nav-trigger[aria-expanded="true"]').forEach((trigger) => {
    if (trigger !== except) trigger.setAttribute('aria-expanded', 'false');
  });
  block.querySelectorAll('.nav-megamenu.is-drilled').forEach((panel) => {
    if (!except || panel !== except.nextElementSibling) resetDrill(panel);
  });
}

function closeSearch(block) {
  searchToggles(block).forEach((toggle) => toggle.setAttribute('aria-expanded', 'false'));
}

function closeLanguages(block) {
  const toggle = block.querySelector('.nav-languages-toggle');
  if (toggle) toggle.setAttribute('aria-expanded', 'false');
}

function closeLogin(block) {
  const toggle = block.querySelector('.nav-login-toggle');
  if (toggle) toggle.setAttribute('aria-expanded', 'false');
  block.classList.remove('nav-login-active');
}

function setMobileMenu(block, open) {
  const button = block.querySelector('.nav-hamburger button');
  block.classList.toggle('nav-mobile-open', open);
  if (button) {
    button.setAttribute('aria-expanded', open ? 'true' : 'false');
    button.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
  }
  document.body.style.overflowY = open && !isDesktop.matches ? 'hidden' : '';
}

function closeAll(block) {
  closeMegamenus(block);
  closeSearch(block);
  closeLanguages(block);
  closeLogin(block);
  setShade(block);
}

/* ---------- row 0: brand ---------- */

function buildBrand(section) {
  const brand = el('div', { className: 'nav-brand' });
  const link = section.querySelector('a');
  const img = section.querySelector('img');
  if (link) {
    const a = el('a', { href: link.getAttribute('href') || '/' });
    if (img) a.append(img);
    else a.textContent = text(link);
    brand.append(a);
  } else if (img) {
    brand.append(img);
  }
  return brand;
}

/* ---------- language selector (Google Translate website translator) ---------- */

function loadTranslateWidget() {
  if (window.google && window.google.translate) return;
  if (document.getElementById('nav-translate-script')) return;
  const holder = el('div', { id: 'nav-translate-element', className: 'nav-translate-element' });
  document.body.append(holder);
  window.navTranslateInit = () => {
    // eslint-disable-next-line no-new, no-undef
    new google.translate.TranslateElement({ pageLanguage: 'en', autoDisplay: false }, 'nav-translate-element');
  };
  const script = el('script', {
    id: 'nav-translate-script',
    src: 'https://translate.google.com/translate_a/element.js?cb=navTranslateInit',
  });
  document.head.append(script);
}

function selectLanguage(code) {
  const { hostname } = window.location;
  const expire = code === 'en' ? '; expires=Thu, 01 Jan 1970 00:00:00 GMT' : '';
  const value = code === 'en' ? '' : `/en/${code}`;
  document.cookie = `googtrans=${value}; path=/${expire}`;
  document.cookie = `googtrans=${value}; path=/; domain=${hostname}${expire}`;
  if (code === 'en') {
    window.location.reload();
    return;
  }
  const combo = document.querySelector('.goog-te-combo');
  if (combo) {
    combo.value = code;
    combo.dispatchEvent(new Event('change'));
  } else {
    loadTranslateWidget();
  }
}

/**
 * Reads the language entries of the utility list item that contains a nested list.
 * @returns {{label: string, options: object[], footer: Element|null}}
 */
function readLanguages(li) {
  const list = li.querySelector(':scope > ul');
  const options = [];
  let footer = null;
  [...(list ? list.children : [])].forEach((item) => {
    const a = item.querySelector('a');
    if (!a) return;
    if (a.querySelector('img')) {
      footer = a;
      return;
    }
    const match = (a.getAttribute('href') || '').match(/googtrans\(([^)]+)\)/);
    options.push({ label: text(a), code: match ? match[1] : '', href: a.getAttribute('href') });
  });
  return { label: ownText(li), options, footer };
}

function buildLanguages(languages, block) {
  const { label, options, footer } = languages;
  const wrapper = el('li', { className: 'nav-languages' });
  const toggle = el('button', {
    type: 'button', className: 'nav-languages-toggle', 'aria-expanded': 'false', 'aria-haspopup': 'true',
  }, el('span', {}, label));
  const dropdown = el('div', { className: 'nav-languages-dropdown', role: 'dialog', 'aria-label': label });
  const list = el('ul', { className: 'nav-languages-list notranslate' });
  const footerEl = el('div', { className: 'nav-languages-footer notranslate' });
  options.forEach((option) => {
    const link = el('a', {
      href: option.href, className: 'nav-language-option', lang: option.code || undefined,
    }, option.label);
    link.addEventListener('click', (e) => {
      e.preventDefault();
      closeLanguages(block);
      if (option.code) selectLanguage(option.code);
    });
    list.append(el('li', {}, link));
  });
  if (footer) footerEl.append(externalize(footer.cloneNode(true)));
  dropdown.append(list, footerEl);
  toggle.addEventListener('click', (e) => {
    e.stopPropagation();
    const open = toggle.getAttribute('aria-expanded') === 'true';
    closeMegamenus(block);
    closeSearch(block);
    closeLogin(block);
    toggle.setAttribute('aria-expanded', open ? 'false' : 'true');
    setShade(block);
  });
  wrapper.append(toggle, dropdown);
  return wrapper;
}

function buildMobileTranslate(languages) {
  const { label, options, footer } = languages;
  const select = el('select', { className: 'nav-mobile-translate-select notranslate', 'aria-label': label });
  options.forEach((option) => select.append(el('option', { value: option.code }, option.label)));
  select.addEventListener('change', () => { if (select.value) selectLanguage(select.value); });
  const wrapper = el('div', { className: 'nav-mobile-translate notranslate' }, select);
  if (footer) wrapper.append(el('p', {}, externalize(footer.cloneNode(true))));
  return wrapper;
}

/* ---------- row 0: utility links ---------- */

function buildUtility(section, block) {
  const ul = el('ul', { className: 'nav-utility' });
  let languages = null;
  const source = section.querySelector('ul');
  [...(source ? source.children : [])].forEach((li) => {
    if (li.querySelector(':scope > ul')) {
      languages = readLanguages(li);
      ul.append(buildLanguages(languages, block));
      return;
    }
    const a = li.querySelector('a');
    if (a) ul.append(el('li', {}, el('a', { href: a.getAttribute('href') }, text(a))));
  });
  return { ul, languages };
}

/* ---------- search ---------- */

function buildSearch(section, block) {
  const link = section ? section.querySelector('a') : null;
  const paragraphs = section ? [...section.querySelectorAll('p')] : [];
  const closeLabel = paragraphs.length > 1 ? text(paragraphs[paragraphs.length - 1]) : '';
  const labelText = text(link);
  const action = link ? link.getAttribute('href') : '/searchresults';

  const toggle = el('button', {
    type: 'button', className: 'nav-search-toggle', 'aria-expanded': 'false', 'aria-controls': 'nav-search', 'aria-label': 'Toggle search',
  }, el('span', { className: 'nav-icon nav-icon-search', 'aria-hidden': 'true' }), el('span', { className: 'nav-icon nav-icon-close', 'aria-hidden': 'true' }));

  const input = el('input', {
    id: 'nav-search-input', type: 'search', name: 'keyword', autocomplete: 'off', className: 'nav-search-input',
  });
  const submit = el('button', {
    type: 'submit', className: 'nav-search-submit', 'aria-label': 'Search', disabled: true,
  }, el('span', { className: 'nav-icon nav-icon-search', 'aria-hidden': 'true' }));
  const close = el('button', { type: 'button', className: 'nav-search-close' }, el('span', { className: 'nav-icon nav-icon-close', 'aria-hidden': 'true' }), closeLabel);
  const form = el(
    'form',
    { action, method: 'GET', role: 'search' },
    el('label', { for: 'nav-search-input' }, labelText),
    el('div', { className: 'nav-search-field' }, input, submit, close),
  );
  const panel = el('div', { id: 'nav-search', className: 'nav-search' }, el('div', { className: 'nav-search-inner' }, form));

  /** toggles the search panel from any control that has aria-controls="nav-search" */
  const toggleSearch = (control) => {
    const open = control.getAttribute('aria-expanded') === 'true';
    closeMegamenus(block);
    closeLanguages(block);
    closeLogin(block);
    setMobileMenu(block, false);
    searchToggles(block).forEach((t) => t.setAttribute('aria-expanded', open ? 'false' : 'true'));
    setShade(block);
    if (!open) input.focus();
  };

  input.addEventListener('input', () => { submit.disabled = !input.value.trim(); });
  toggle.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleSearch(toggle);
  });
  close.addEventListener('click', () => {
    closeSearch(block);
    setShade(block);
    toggle.focus();
  });
  return { toggle, panel, toggleSearch };
}

/* ---------- login ---------- */

function readLoginLinks(section) {
  const source = section.querySelector('ul');
  return [...(source ? source.children : [])].map((li) => ({
    link: li.querySelector('a'), img: li.querySelector('img'),
  })).filter((item) => item.link);
}

function buildLogin(section, block) {
  const trigger = section.querySelector('p');
  const icon = trigger ? trigger.querySelector('img') : null;
  const label = text(trigger);
  const toggle = el('button', {
    type: 'button', className: 'nav-login-toggle', 'aria-expanded': 'false', 'aria-controls': 'nav-login',
  });
  if (icon) {
    icon.alt = '';
    toggle.append(icon);
  }
  toggle.append(el('span', {}, label));

  const closeBtn = el('button', { type: 'button', className: 'nav-login-close', 'aria-label': `${label} close` }, el('span', { className: 'nav-icon nav-icon-close', 'aria-hidden': 'true' }));
  const list = el('ul', { className: 'nav-login-list' });
  readLoginLinks(section).forEach(({ link, img }) => {
    list.append(el('li', {}, img, externalize(el('a', { href: link.getAttribute('href') }, text(link)))));
  });
  const panel = el(
    'div',
    {
      id: 'nav-login', className: 'nav-login', role: 'region', 'aria-label': label,
    },
    el('div', { className: 'nav-login-top' }, el('p', { className: 'nav-login-title' }, label), closeBtn),
    list,
  );
  const overlay = el('div', { className: 'nav-login-overlay' });

  const setOpen = (open) => {
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    block.classList.toggle('nav-login-active', open);
  };
  toggle.addEventListener('click', (e) => {
    e.stopPropagation();
    closeMegamenus(block);
    closeSearch(block);
    closeLanguages(block);
    setShade(block);
    setOpen(toggle.getAttribute('aria-expanded') !== 'true');
    if (toggle.getAttribute('aria-expanded') === 'true') closeBtn.focus();
  });
  closeBtn.addEventListener('click', () => { setOpen(false); toggle.focus(); });
  overlay.addEventListener('click', () => setOpen(false));
  return { toggle, panel, overlay };
}

/** mobile: login accordion at the top of the menu panel */
function buildMobileLogin(section) {
  const label = text(section.querySelector('p'));
  const listId = 'nav-mobile-login-list';
  const toggle = el('button', {
    type: 'button', className: 'nav-mobile-login-toggle', 'aria-expanded': 'false', 'aria-controls': listId,
  }, label);
  const list = el('ul', { id: listId, className: 'nav-mobile-login-list' });
  readLoginLinks(section).forEach(({ link }) => {
    list.append(el('li', {}, externalize(el('a', { href: link.getAttribute('href') }, text(link)))));
  });
  toggle.addEventListener('click', () => {
    toggle.setAttribute('aria-expanded', toggle.getAttribute('aria-expanded') === 'true' ? 'false' : 'true');
  });
  return el('div', { className: 'nav-mobile-login' }, toggle, list);
}

/* ---------- row 1: megamenus ---------- */

function activateCategory(categories, item) {
  const drilled = !isDesktop.matches;
  categories.querySelectorAll(':scope > .nav-category').forEach((cat) => {
    const active = cat === item;
    cat.classList.toggle('is-active', active);
    cat.querySelector('.nav-category-title').setAttribute('aria-expanded', active ? 'true' : 'false');
  });
  if (drilled) {
    const panel = categories.closest('.nav-megamenu');
    panel.classList.add('is-drilled');
    panel.scrollTop = 0;
  }
}

function buildBackButton(label, onBack) {
  const button = el(
    'button',
    { type: 'button', className: 'nav-back' },
    srOnly('Currently showing child pages of '),
    label,
    srOnly('. Tap to go back to previous navigation level.'),
  );
  button.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    onBack();
  });
  return button;
}

function buildCategory(li, index, categories) {
  const labelLink = li.querySelector(':scope > a');
  const visible = text(labelLink) || text(li.firstChild);
  const lists = [...li.querySelectorAll(':scope > ul')];
  const paragraphs = [...li.querySelectorAll(':scope > p')];
  const a11y = paragraphs.find((p) => text(p) !== visible && text(p).startsWith(visible));
  const tasksHeading = paragraphs.find((p) => p !== a11y);

  const item = el('li', { className: `nav-category${index === 0 ? ' is-active' : ''}` });
  const button = el('button', {
    type: 'button', className: 'nav-category-title', 'aria-expanded': index === 0 ? 'true' : 'false',
  }, visible);
  applyAccessibleLabel(button, visible, a11y ? text(a11y) : '');

  const links = el('ul', { className: 'nav-category-links' });
  [...(lists[0] ? lists[0].children : [])].forEach((child) => {
    const a = child.querySelector('a');
    if (a) links.append(el('li', {}, el('a', { href: a.getAttribute('href'), className: 'nav-link-title' }, text(a))));
  });

  const tasks = el('div', { className: 'nav-category-tasks' });
  if (tasksHeading) tasks.append(el('h3', { className: 'nav-tasks-heading' }, text(tasksHeading)));
  const taskList = el('ul', { className: 'nav-tasks-links' });
  [...(lists[1] ? lists[1].children : [])].forEach((child) => {
    const a = child.querySelector('a');
    if (a) taskList.append(el('li', {}, externalize(el('a', { href: a.getAttribute('href'), className: 'nav-link-title' }, text(a)))));
  });
  tasks.append(taskList);

  const back = buildBackButton(visible, () => {
    const panel = categories.closest('.nav-megamenu');
    resetDrill(panel);
    button.focus();
  });
  const body = el('div', { className: 'nav-category-body' }, back, links, tasks);

  button.addEventListener('click', (e) => {
    e.preventDefault();
    activateCategory(categories, item);
  });
  item.append(button, body);
  return item;
}

function buildMegamenu(section, block, index) {
  const heading = section.querySelector(':scope > h2');
  const label = text(heading);
  const directParagraphs = [...section.querySelectorAll(':scope > p')];
  const triggerLabel = directParagraphs.find((p) => text(p).startsWith(label) && text(p) !== label);
  const closeLabel = directParagraphs.find((p) => p !== triggerLabel);

  const li = el('li', { className: 'nav-item' });
  const panelId = `nav-megamenu-${index}`;
  const trigger = el('a', {
    href: '#', role: 'button', className: 'nav-trigger', 'aria-expanded': 'false', 'aria-controls': panelId,
  }, label);
  applyAccessibleLabel(trigger, label, triggerLabel ? text(triggerLabel) : '');

  const panel = el('div', { id: panelId, className: 'nav-megamenu' });
  const categories = el('ul', { className: 'nav-categories' });
  const source = section.querySelector(':scope > ul');
  [...(source ? source.children : [])].forEach((child, i) => {
    categories.append(buildCategory(child, i, categories));
  });
  const back = buildBackButton(label, () => {
    trigger.setAttribute('aria-expanded', 'false');
    resetDrill(panel);
    trigger.focus();
  });
  const close = el('button', { type: 'button', className: 'nav-megamenu-close' }, srOnly(closeLabel ? text(closeLabel) : ''));
  panel.append(back, categories, close);

  const toggle = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const open = trigger.getAttribute('aria-expanded') === 'true';
    closeMegamenus(block, trigger);
    closeSearch(block);
    closeLanguages(block);
    closeLogin(block);
    trigger.setAttribute('aria-expanded', open ? 'false' : 'true');
    if (!open && !isDesktop.matches) {
      const nav = trigger.closest('nav');
      if (nav) nav.scrollTop = 0;
      panel.scrollTop = 0;
    }
    setShade(block);
  };
  trigger.addEventListener('click', toggle);
  trigger.addEventListener('keydown', (e) => {
    if (e.key === ' ') toggle(e);
  });
  close.addEventListener('click', () => {
    trigger.setAttribute('aria-expanded', 'false');
    setShade(block);
    trigger.focus();
  });
  li.append(trigger, panel);
  return li;
}

/* ---------- mobile toolbar ---------- */

function buildToolbar(section, block, search) {
  const items = section ? [...(section.querySelector('ul') || { children: [] }).children] : [];
  const [menuItem, searchItem, ...linkItems] = items;
  const list = el('ul');

  const hamburger = el('button', {
    type: 'button', 'aria-controls': 'nav', 'aria-expanded': 'false', 'aria-label': 'Open navigation',
  }, el('span', { className: 'nav-toolbar-icon nav-hamburger-icon', 'aria-hidden': 'true' }), el('span', { className: 'nav-toolbar-label' }, text(menuItem)));
  hamburger.addEventListener('click', (e) => {
    e.stopPropagation();
    if (isDesktop.matches) return;
    const open = !block.classList.contains('nav-mobile-open');
    closeAll(block);
    setMobileMenu(block, open);
  });
  list.append(el('li', { className: 'nav-hamburger' }, hamburger));

  const searchButton = el('button', {
    type: 'button', className: 'nav-toolbar-search', 'aria-controls': 'nav-search', 'aria-expanded': 'false',
  }, el('span', { className: 'nav-toolbar-icon nav-toolbar-search-icon', 'aria-hidden': 'true' }), el('span', { className: 'nav-toolbar-label' }, text(searchItem)));
  searchButton.addEventListener('click', (e) => {
    e.stopPropagation();
    search.toggleSearch(searchButton);
  });
  list.append(el('li', {}, searchButton));

  linkItems.forEach((item) => {
    const a = item.querySelector('a');
    if (!a) return;
    const img = a.querySelector('img');
    const link = el('a', { href: a.getAttribute('href'), className: 'nav-toolbar-link' });
    if (img) {
      img.alt = '';
      img.className = 'nav-toolbar-icon';
      link.append(img);
    }
    link.append(el('span', { className: 'nav-toolbar-label' }, text(a)));
    list.append(el('li', {}, link));
  });
  return el('div', { className: 'nav-toolbar' }, list);
}

function buildMobileLinks(section) {
  const lists = section ? [...section.querySelectorAll(':scope > ul')] : [];
  const ul = el('ul', { className: 'nav-mobile-links' });
  [...(lists[1] ? lists[1].children : [])].forEach((li) => {
    const a = li.querySelector('a');
    if (a) ul.append(el('li', {}, el('a', { href: a.getAttribute('href') }, text(a))));
  });
  return ul;
}

/* ---------- viewport changes ---------- */

function syncViewport(block) {
  setMobileMenu(block, false);
  closeAll(block);
  block.querySelectorAll('.nav-megamenu').forEach((panel) => panel.classList.remove('is-drilled'));
  block.querySelectorAll('.nav-category').forEach((cat) => {
    const expanded = isDesktop.matches && cat.classList.contains('is-active');
    cat.querySelector('.nav-category-title').setAttribute('aria-expanded', expanded ? 'true' : 'false');
  });
  const loginToggle = block.querySelector('.nav-mobile-login-toggle');
  if (loginToggle) loginToggle.setAttribute('aria-expanded', 'false');
}

/**
 * loads and decorates the header
 * @param {Element} block The header block element
 */
export default async function decorate(block) {
  const fragment = await fetchNavFragment();
  block.textContent = '';
  if (!fragment) return;

  const root = document.createElement('div');
  root.innerHTML = fragment.html;
  resolveImages(root, fragment.url);

  const sections = [...root.children].filter((s) => s.tagName === 'DIV');
  const menuSections = sections.filter((s) => s.firstElementChild && s.firstElementChild.tagName === 'H2');
  const [brandSection, utilitySection, searchSection, loginSection, mobileSection] = sections
    .filter((s) => !menuSections.includes(s));

  const top = el('div', { className: 'nav-top' });
  if (brandSection) top.append(buildBrand(brandSection));
  let languages = null;
  if (utilitySection) {
    const utility = buildUtility(utilitySection, block);
    top.append(utility.ul);
    ({ languages } = utility);
  }
  const search = buildSearch(searchSection, block);
  top.append(search.toggle);
  let login = null;
  if (loginSection) {
    login = buildLogin(loginSection, block);
    top.append(login.toggle);
  }

  const nav = el('nav', { id: 'nav', 'aria-label': 'Main navigation' });
  if (loginSection) nav.append(buildMobileLogin(loginSection));
  const primary = el('ul', { className: 'nav-primary' });
  menuSections.forEach((section, i) => primary.append(buildMegamenu(section, block, i)));
  nav.append(primary, buildMobileLinks(mobileSection));
  if (languages) nav.append(buildMobileTranslate(languages));

  const shade = el('div', { className: 'nav-shade' });
  shade.addEventListener('click', () => closeAll(block));

  // toolbar first: its menu button is the first navigation control in DOM order
  const wrapper = el('div', { className: 'nav-wrapper' }, buildToolbar(mobileSection, block, search), top, nav, search.panel, shade);
  if (login) wrapper.append(login.overlay, login.panel);
  block.append(wrapper);
  syncViewport(block);

  isDesktop.addEventListener('change', () => syncViewport(block));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeAll(block);
      setMobileMenu(block, false);
    }
  });
  document.addEventListener('click', (e) => {
    if (!getHeader(e.target) || e.target.closest('.nav-shade')) closeAll(block);
    else if (!e.target.closest('.nav-languages')) {
      closeLanguages(block);
    }
  });
}
