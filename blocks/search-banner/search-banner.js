/**
 * Search banner: label + search input + icon submit button in an elevated panel.
 * Authored rows (both optional):
 *   1. label text (e.g. "How can we help?")
 *   2. link / URL: a *.json query index (results render inline) or a
 *      search results page (form submits there with ?q=<term>).
 * @param {Element} block The block element
 */

function readConfig(block) {
  let label = '';
  let source = '';
  [...block.children].forEach((row) => {
    const link = row.querySelector('a[href]');
    const text = row.textContent.trim();
    if (link) source = link.href;
    else if (/^(https?:\/\/|\/)\S+$/.test(text)) source = text;
    else if (text && !label) label = text;
  });
  if (!source) source = `${window.hlx?.codeBasePath || ''}/query-index.json`;
  return { label, source };
}

async function fetchIndex(source) {
  try {
    const resp = await fetch(source);
    if (!resp.ok) return [];
    const json = await resp.json();
    return json?.data || [];
  } catch {
    return [];
  }
}

function filterData(terms, data) {
  return data
    .map((item) => {
      const hay = `${item.title || ''} ${item.description || ''} ${item.path || ''}`.toLowerCase();
      const hits = terms.filter((t) => hay.includes(t)).length;
      return { item, hits };
    })
    .filter(({ hits }) => hits === terms.length)
    .map(({ item }) => item);
}

function renderResults(list, results) {
  list.replaceChildren();
  if (!results.length) {
    const li = document.createElement('li');
    li.className = 'search-banner-no-results';
    li.textContent = 'No results found.';
    list.append(li);
    return;
  }
  results.forEach((r) => {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = r.path;
    a.textContent = r.title || r.path;
    li.append(a);
    if (r.description) {
      const p = document.createElement('p');
      p.textContent = r.description;
      li.append(p);
    }
    list.append(li);
  });
}

export default async function decorate(block) {
  const { label, source } = readConfig(block);
  const inline = /\.json(\?|$)/.test(source);
  const inputId = `search-banner-input-${Math.random().toString(36).slice(2, 8)}`;

  const form = document.createElement('form');
  form.className = 'search-banner-form';
  form.setAttribute('role', 'search');

  if (label) {
    const labelEl = document.createElement('label');
    labelEl.className = 'search-banner-label';
    labelEl.htmlFor = inputId;
    labelEl.textContent = label;
    form.append(labelEl);
  }

  const box = document.createElement('div');
  box.className = 'search-banner-box';
  const input = document.createElement('input');
  input.type = 'search';
  input.id = inputId;
  input.name = 'q';
  input.className = 'search-banner-input';
  input.placeholder = 'Search icare';
  if (!label) input.setAttribute('aria-label', 'Search');

  const button = document.createElement('button');
  button.type = 'submit';
  button.className = 'search-banner-button';
  button.setAttribute('aria-label', 'Submit search');
  const icon = document.createElement('span');
  icon.className = 'search-banner-icon';
  icon.setAttribute('aria-hidden', 'true');
  button.append(icon);

  box.append(input, button);
  form.append(box);

  const results = document.createElement('ul');
  results.className = 'search-banner-results';
  results.setAttribute('aria-live', 'polite');

  let indexData;
  const runInline = async () => {
    const terms = input.value.toLowerCase().split(/\s+/).filter(Boolean);
    if (!terms.length || input.value.trim().length < 3) {
      results.replaceChildren();
      return;
    }
    if (!indexData) indexData = await fetchIndex(source);
    renderResults(results, filterData(terms, indexData));
  };

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const q = input.value.trim();
    if (inline) {
      runInline();
      return;
    }
    const url = new URL(source, window.location.href);
    if (q) url.searchParams.set('q', q);
    window.location.href = url.toString();
  });

  if (inline) {
    input.addEventListener('input', runInline);
    input.addEventListener('keyup', (e) => {
      if (e.key === 'Escape') {
        input.value = '';
        results.replaceChildren();
      }
    });
  }

  block.replaceChildren(form);
  if (inline) block.append(results);

  const q = new URL(window.location.href).searchParams.get('q');
  if (q) {
    input.value = q;
    if (inline) runInline();
  }
}
