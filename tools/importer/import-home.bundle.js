/* eslint-disable */
var CustomImportScript = (() => {
  var __defProp = Object.defineProperty;
  var __defProps = Object.defineProperties;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getOwnPropSymbols = Object.getOwnPropertySymbols;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __propIsEnum = Object.prototype.propertyIsEnumerable;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    if (__getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(b)) {
        if (__propIsEnum.call(b, prop))
          __defNormalProp(a, prop, b[prop]);
      }
    return a;
  };
  var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // tools/importer/import-home.js
  var import_home_exports = {};
  __export(import_home_exports, {
    default: () => import_home_default
  });

  // tools/importer/parsers/hero-home.js
  function parse(element, { document }) {
    const scope = element.querySelector(":scope > .show-on-full-width") || element.querySelector(":scope > .l-padding") || element;
    const image = scope.querySelector(".image-container img, img");
    const heading = scope.querySelector(".content h1, .content h2, h1, h2");
    const content = scope.querySelector(".content") || scope;
    const paragraphs = Array.from(content.querySelectorAll(":scope > p")).filter((p) => p.textContent.trim());
    if (!image && !heading && !paragraphs.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cells = [];
    const imageCell = document.createDocumentFragment();
    if (image) {
      const img = document.createElement("img");
      img.src = image.getAttribute("src");
      img.alt = image.getAttribute("alt") || "";
      imageCell.appendChild(document.createComment(" field:image "));
      imageCell.appendChild(img);
    }
    cells.push([imageCell]);
    const textCell = document.createDocumentFragment();
    if (heading || paragraphs.length) {
      textCell.appendChild(document.createComment(" field:text "));
      if (heading) textCell.appendChild(heading);
      paragraphs.forEach((p) => textCell.appendChild(p));
    }
    cells.push([textCell]);
    const block = WebImporter.Blocks.createBlock(document, { name: "hero-home", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/search-banner.js
  function parse2(element, { document }) {
    const labelEl = element.querySelector('.search-box-headding, .hero-serach-headding, label, [class*="heading"], [class*="headding"]');
    const labelText = labelEl && labelEl.textContent.trim() || "How can we help?";
    const form = element.querySelector("form[action]");
    const action = form && form.getAttribute("action");
    const sourceHref = action && action !== "#" ? action : "/query-index.json";
    const cells = [];
    const labelCell = document.createDocumentFragment();
    labelCell.appendChild(document.createComment(" field:label "));
    labelCell.appendChild(document.createTextNode(labelText));
    cells.push([labelCell]);
    const sourceCell = document.createDocumentFragment();
    const link = document.createElement("a");
    link.href = sourceHref;
    link.textContent = sourceHref;
    sourceCell.appendChild(document.createComment(" field:source "));
    sourceCell.appendChild(link);
    cells.push([sourceCell]);
    const block = WebImporter.Blocks.createBlock(document, { name: "search-banner", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-audience.js
  function parse3(element, { document }) {
    let items = Array.from(element.querySelectorAll(".tab-content")).map((body) => ({
      body,
      link: body.closest("a[href]")
    }));
    if (!items.length) {
      items = Array.from(element.querySelectorAll(":scope > a.cm-home-tile, :scope > a[href]")).map((a) => ({ body: a, link: a }));
    }
    const cells = [];
    items.forEach(({ body, link }) => {
      const icon = Array.from(body.querySelectorAll("img")).find((img) => !img.closest(".home-tile-link"));
      const headingEl = body.querySelector(".tile-headding, h2, h3, h4");
      const title = headingEl ? headingEl.textContent.trim() : "";
      if (!icon && !title) return;
      const imageCell = document.createDocumentFragment();
      if (icon) {
        const img = document.createElement("img");
        img.src = icon.getAttribute("src");
        img.alt = icon.getAttribute("alt") || "";
        imageCell.appendChild(document.createComment(" field:image "));
        imageCell.appendChild(img);
      }
      const textCell = document.createDocumentFragment();
      if (title) {
        const h = document.createElement(headingEl && /^H[1-6]$/.test(headingEl.tagName) ? headingEl.tagName.toLowerCase() : "h2");
        const href = link && link.getAttribute("href");
        if (href) {
          const a = document.createElement("a");
          a.href = href;
          a.textContent = title;
          h.appendChild(a);
        } else {
          h.textContent = title;
        }
        textCell.appendChild(document.createComment(" field:text "));
        textCell.appendChild(h);
      }
      cells.push([imageCell, textCell]);
    });
    if (!cells.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document, { name: "cards-audience", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/columns-campaign.js
  function parse4(element, { document }) {
    const items = Array.from(element.querySelectorAll(":scope > .sl-item"));
    const primary = element.querySelector(".campaign-primary") || items[0];
    const secondaryScope = items[1] || element;
    const introCell = [];
    if (primary) {
      const heading = primary.querySelector("h1, h2, h3, h4");
      if (heading) {
        const h2 = document.createElement("h2");
        h2.textContent = heading.textContent.trim();
        introCell.push(h2);
      }
      Array.from(primary.querySelectorAll("p")).filter((p) => p.textContent.trim()).forEach((p) => introCell.push(p));
      const cta = primary.querySelector("a.cta, a[href]");
      if (cta) {
        const p = document.createElement("p");
        const a = document.createElement("a");
        a.href = cta.getAttribute("href");
        a.textContent = cta.textContent.trim();
        if (cta.getAttribute("title")) a.title = cta.getAttribute("title");
        p.appendChild(a);
        introCell.push(p);
      }
    }
    let panels = Array.from(secondaryScope.querySelectorAll(".campaign-secondary"));
    if (!panels.length) {
      panels = Array.from(secondaryScope.querySelectorAll("a.cm-image-block-link"));
    }
    const panelCell = [];
    panels.forEach((panel) => {
      const link = panel.closest("a[href]") || panel.querySelector("a[href]");
      const heading = panel.querySelector("h1, h2, h3, h4");
      const title = heading ? heading.textContent.trim() : "";
      if (title) {
        const panelHeading = document.createElement(heading.tagName.toLowerCase());
        if (link) {
          const a = document.createElement("a");
          a.href = link.getAttribute("href");
          a.textContent = title;
          panelHeading.appendChild(a);
        } else {
          panelHeading.textContent = title;
        }
        panelCell.push(panelHeading);
      }
      Array.from(panel.querySelectorAll("p")).filter((p) => p.textContent.trim()).forEach((p) => {
        const np = document.createElement("p");
        np.textContent = p.textContent.trim();
        panelCell.push(np);
      });
    });
    if (!introCell.length && !panelCell.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cells = [[introCell, panelCell.length ? panelCell : ""]];
    const block = WebImporter.Blocks.createBlock(document, { name: "Columns (campaign)", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/columns-story.js
  function parse5(element, { document }) {
    const makeImg = (src) => {
      if (!src) return null;
      const img = document.createElement("img");
      img.src = src.getAttribute("src");
      img.alt = src.getAttribute("alt") || "";
      return img;
    };
    const makeLinkP = (a) => {
      if (!a) return null;
      const p = document.createElement("p");
      const link = document.createElement("a");
      link.href = a.getAttribute("href");
      link.textContent = a.textContent.trim();
      p.appendChild(link);
      return p;
    };
    const textP = (text) => {
      const p = document.createElement("p");
      p.textContent = text;
      return p;
    };
    const feature = element.querySelector(".content-paralympic") || element.querySelector(":scope > .sl-item:not(.paralympic-right)");
    const featureCell = [];
    if (feature) {
      const heading = feature.querySelector("h1, h2, h3, .story-title");
      if (heading) {
        const h2 = document.createElement("h2");
        h2.textContent = heading.textContent.trim();
        featureCell.push(h2);
      }
      const img = makeImg(feature.querySelector(".paralympic-left-image, img"));
      if (img) featureCell.push(img);
      const textEl = feature.querySelector(".paralympic-text");
      if (textEl) {
        const paras = Array.from(textEl.querySelectorAll("p"));
        if (paras.length) paras.forEach((p) => featureCell.push(textP(p.textContent.trim())));
        else if (textEl.textContent.trim()) featureCell.push(textP(textEl.textContent.trim()));
      }
      const cta = makeLinkP(feature.querySelector("a.cta, a[href]"));
      if (cta) featureCell.push(cta);
    }
    const listCell = [];
    element.querySelectorAll(".paralympic-right-section").forEach((section) => {
      const img = makeImg(section.querySelector("img"));
      if (img) listCell.push(img);
      const headline = section.querySelector(".paralympic-headline, h3, h4");
      if (headline) {
        const h3 = document.createElement("h3");
        h3.textContent = headline.textContent.trim();
        listCell.push(h3);
      }
      const body = section.querySelector(".paralympic-multi-text") || section;
      Array.from(body.querySelectorAll("p")).filter((p) => !p.querySelector("a") && p.textContent.trim()).forEach((p) => listCell.push(textP(p.textContent.trim())));
      const link = makeLinkP(body.querySelector("a[href]"));
      if (link) listCell.push(link);
    });
    if (!featureCell.length && !listCell.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cells = [[featureCell.length ? featureCell : "", listCell.length ? listCell : ""]];
    const block = WebImporter.Blocks.createBlock(document, { name: "Columns (story)", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-news.js
  function extractBgUrl(el) {
    if (!el) return null;
    const candidates = [el, ...el.querySelectorAll("[style], [data-src], [data-bg], [data-background], [data-background-image]")];
    for (const node of candidates) {
      const style = node.getAttribute("style") || "";
      const m = style.match(/background(?:-image)?\s*:[^;]*url\(\s*['"]?([^'")]+)['"]?\s*\)/i);
      if (m) return m[1];
      const data = node.getAttribute("data-bg") || node.getAttribute("data-background") || node.getAttribute("data-background-image") || node.getAttribute("data-src");
      if (data) {
        const dm = data.match(/url\(\s*['"]?([^'")]+)['"]?\s*\)/i);
        return dm ? dm[1] : data;
      }
    }
    return null;
  }
  function parse6(element, { document }) {
    let items = Array.from(element.querySelectorAll(".sl-list > .sl-item"));
    if (!items.length) items = Array.from(element.querySelectorAll("section.cm"));
    const cells = [];
    items.forEach((item) => {
      var _a, _b, _c;
      const content = item.querySelector(".content") || item;
      const heading = content.querySelector("h1, h2, h3, h4");
      const title = heading ? heading.textContent.trim() : "";
      const link = item.querySelector("a[href]");
      const href = link ? link.getAttribute("href") : null;
      if (!title && !href) return;
      const imageCell = document.createDocumentFragment();
      const bg = item.querySelector('.module-background, [class*="background"]');
      let imgSrc = null;
      let imgAlt = "";
      const bgImg = bg ? bg.querySelector("img") : null;
      if (bgImg && bgImg.getAttribute("src")) {
        imgSrc = bgImg.getAttribute("src");
        imgAlt = bgImg.getAttribute("alt") || "";
      } else {
        imgSrc = extractBgUrl(bg) || item.classList && extractBgUrl(item.querySelector("section.cm-featured-content-module"));
      }
      if (imgSrc) {
        const img = document.createElement("img");
        img.src = imgSrc;
        img.alt = imgAlt || title;
        imageCell.appendChild(document.createComment(" field:image "));
        imageCell.appendChild(img);
      }
      const textCell = document.createDocumentFragment();
      textCell.appendChild(document.createComment(" field:text "));
      const sub = content.querySelector(".subheading");
      if (sub) {
        const type = (((_a = sub.querySelector(".content-type")) == null ? void 0 : _a.textContent) || "").trim();
        const date = (((_b = sub.querySelector(".subtitle")) == null ? void 0 : _b.textContent) || "").trim();
        if (type || date) {
          const meta = document.createElement("p");
          if (type) {
            const strong = document.createElement("strong");
            strong.textContent = type;
            meta.appendChild(strong);
            if (date) meta.appendChild(document.createTextNode(" "));
          }
          if (date) meta.appendChild(document.createTextNode(date));
          textCell.appendChild(meta);
        }
      }
      if (title) {
        const h3 = document.createElement("h3");
        h3.textContent = title;
        textCell.appendChild(h3);
      }
      Array.from(content.querySelectorAll("p")).filter((p) => !p.classList.contains("subheading") && p.textContent.trim()).forEach((p) => {
        const np = document.createElement("p");
        np.textContent = p.textContent.trim();
        textCell.appendChild(np);
      });
      if (href) {
        const ctaText = (((_c = content.querySelector(".faux-link")) == null ? void 0 : _c.textContent) || "").trim() || "Read more";
        const p = document.createElement("p");
        const a = document.createElement("a");
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
    const block = WebImporter.Blocks.createBlock(document, { name: "cards-news", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-resource.js
  function parse7(element, { document }) {
    const titles = Array.from(element.querySelectorAll(".icare-resource-title, h3"));
    const allCards = Array.from(element.querySelectorAll("a.icare-resource-card"));
    const cells = [];
    titles.forEach((titleEl, i) => {
      var _a, _b;
      const card = titleEl.closest("a.icare-resource-card, a[href]") || allCards[i] || null;
      const scope = card && card.querySelectorAll(".icare-resource-title, h3").length === 1 ? card : null;
      const pick = (sel) => scope ? scope.querySelector(sel) : element.querySelectorAll(sel)[i];
      const icon = pick(".icare-resource-icon img");
      const body = pick(".icare-resource-body");
      const cta = pick(".icare-resource-cta");
      const href = ((_a = allCards[i]) == null ? void 0 : _a.getAttribute("href")) || (card == null ? void 0 : card.getAttribute("href"));
      const title = titleEl.textContent.trim();
      if (!title) return;
      const imageCell = document.createDocumentFragment();
      if (icon) {
        const img = document.createElement("img");
        let src = icon.getAttribute("src") || "";
        if (!/^https?:\/\//i.test(src)) {
          try {
            src = new URL(src, "https://www.icare.nsw.gov.au/").href;
          } catch (e) {
          }
        }
        if (/\.svg$/i.test(src)) src += "?iar=0";
        img.src = src;
        img.alt = icon.getAttribute("alt") || `${title} icon`;
        imageCell.appendChild(document.createComment(" field:image "));
        imageCell.appendChild(img);
      }
      const textCell = document.createDocumentFragment();
      textCell.appendChild(document.createComment(" field:text "));
      const h3 = document.createElement("h3");
      h3.textContent = title;
      textCell.appendChild(h3);
      if (body && body.textContent.trim()) {
        const p = document.createElement("p");
        p.textContent = body.textContent.trim();
        textCell.appendChild(p);
      }
      if (href) {
        const ctaLabel = ((_b = cta == null ? void 0 : cta.querySelector("span:not(.icare-resource-cta-icon)")) == null ? void 0 : _b.textContent.trim()) || "Explore hub";
        const p = document.createElement("p");
        const a = document.createElement("a");
        a.href = href;
        a.textContent = ctaLabel;
        p.appendChild(a);
        textCell.appendChild(p);
      }
      cells.push([imageCell, textCell]);
    });
    if (!cells.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document, { name: "cards-resource", cells });
    element.replaceWith(block);
  }

  // tools/importer/transformers/icare-cleanup.js
  var TransformHook = { beforeTransform: "beforeTransform", afterTransform: "afterTransform" };
  function normalizeCtaLong(element, document) {
    element.querySelectorAll(".cta-long-section").forEach((ctaSection) => {
      const links = [...ctaSection.querySelectorAll("a.cta-long")];
      if (!links.length) return;
      const heading = [...ctaSection.querySelectorAll(".cta-coloumn-headding h2")].find((h) => h.textContent.trim());
      const ul = document.createElement("ul");
      links.forEach((link) => {
        const labelEl = link.querySelector("span.tile-headding");
        const text = (labelEl ? labelEl.textContent : link.textContent).trim();
        if (!text) return;
        const a = document.createElement("a");
        a.href = link.getAttribute("href");
        a.textContent = text;
        const li = document.createElement("li");
        li.append(a);
        ul.append(li);
      });
      ctaSection.textContent = "";
      if (heading) {
        const h2 = document.createElement("h2");
        h2.textContent = heading.textContent.trim();
        ctaSection.append(h2);
      }
      ctaSection.append(ul);
    });
  }
  function unwrapNextImages(element) {
    element.querySelectorAll("img").forEach((img) => {
      const src = img.getAttribute("src") || "";
      if (!src.includes("/_next/image")) return;
      try {
        const original = new URL(src, "https://www.icare.nsw.gov.au").searchParams.get("url");
        if (original) {
          img.setAttribute("src", new URL(original, "https://www.icare.nsw.gov.au").href);
          img.removeAttribute("srcset");
        }
      } catch (e) {
      }
    });
  }
  function markCtaButtons(element, document) {
    element.querySelectorAll("a.cta").forEach((a) => {
      if (a.closest("strong, em") || a.querySelector("img")) return;
      const wrapper = document.createElement(a.classList.contains("is-secondary") ? "em" : "strong");
      a.replaceWith(wrapper);
      wrapper.append(a);
    });
  }
  function transform(hookName, element, payload) {
    const document = element.ownerDocument;
    if (hookName === TransformHook.beforeTransform) {
      unwrapNextImages(element);
      markCtaButtons(element, document);
      WebImporter.DOMUtils.remove(element, [
        // Inline styles/scripts (e.g. <style> tags inside the .ck-content rich-text container)
        "style",
        "script",
        "noscript",
        // Floating "Your feedback" widget (section#main-feedback) + its overlay + reCAPTCHA
        "#main-feedback",
        ".feedback-overlay",
        ".grecaptcha-badge",
        // Google Translate widget (div.skiptranslate, #goog-gt-tt, VIpgJd-* containers/iframes)
        ".skiptranslate",
        "#goog-gt-tt",
        ".VIpgJd-ZVi9od-aZ2wEe-wOHMyf",
        // Multilingual disclaimer modal
        ".modal-container",
        // Hidden duplicate mobile hero (second .l-padding with duplicate h1 + image)
        "section.homepage-hero-banner > .l-padding.show-on-mobile",
        // Visually-hidden duplicate hero title text next to hero image
        "section.homepage-hero-banner .image-container span.vh",
        // Decorative separators inside the story module; would otherwise become section breaks
        "hr.paralympic-separation"
      ]);
    }
    if (hookName === TransformHook.afterTransform) {
      normalizeCtaLong(element, document);
      WebImporter.DOMUtils.remove(element, [
        // Global chrome
        "header.global-header",
        "footer.global-footer",
        "#global-search",
        ".primary-offscreen-container",
        ".shade-bg",
        // Skip links
        "ul#top.accessibility-links",
        // Next.js / Sitecore runtime elements
        "next-route-announcer",
        "byoc-registration",
        // Leftovers
        "iframe",
        "link",
        "noscript",
        "style",
        "script"
      ]);
    }
  }

  // tools/importer/transformers/icare-sections.js
  var SECTION_MARKER_ATTR = "data-excat-section-id";
  function querySection(root, selectors) {
    const list = Array.isArray(selectors) ? selectors : [selectors];
    for (const sel of list) {
      if (!sel) continue;
      const el = root.querySelector(sel);
      if (el) return el;
    }
    return null;
  }
  function transform2(hookName, element, payload) {
    const sections = payload && payload.template && payload.template.sections || [];
    const document = element.ownerDocument;
    if (hookName === "beforeTransform") {
      for (let i = sections.length - 1; i >= 0; i -= 1) {
        const section = sections[i];
        if (i === 0 && !section.style) continue;
        const sectionEl = querySection(element, section.selector);
        if (!sectionEl) continue;
        const hr = document.createElement("hr");
        if (section.style) hr.setAttribute(SECTION_MARKER_ATTR, section.id);
        sectionEl.before(hr);
      }
    }
    if (hookName === "afterTransform") {
      for (let i = sections.length - 1; i >= 0; i -= 1) {
        const section = sections[i];
        if (!section.style) continue;
        const marker = element.querySelector(`[${SECTION_MARKER_ATTR}="${section.id}"]`);
        const anchor = marker || querySection(element, section.selector);
        if (!anchor) continue;
        const metadataBlock = WebImporter.Blocks.createBlock(document, {
          name: "Section Metadata",
          cells: { style: section.style }
        });
        anchor.after(metadataBlock);
        if (marker) {
          marker.removeAttribute(SECTION_MARKER_ATTR);
          if (i === 0) marker.remove();
        }
      }
    }
  }

  // tools/importer/import-home.js
  var parsers = {
    "hero-home": parse,
    "search-banner": parse2,
    "cards-audience": parse3,
    "columns-campaign": parse4,
    "columns-story": parse5,
    "cards-news": parse6,
    "cards-resource": parse7
  };
  var PAGE_TEMPLATE = {
    "name": "home",
    "urls": [
      "https://www.icare.nsw.gov.au/"
    ],
    "representativeUrl": "https://www.icare.nsw.gov.au/",
    "description": "icare home page",
    "blocks": [
      {
        "name": "hero-home",
        "instances": [
          ".hero-banner-container section.homepage-hero-banner"
        ]
      },
      {
        "name": "search-banner",
        "instances": [
          "#banner-search"
        ]
      },
      {
        "name": "cards-audience",
        "instances": [
          "section.all-category-home-tile-wrapper .home-tile-wrapper"
        ]
      },
      {
        "name": "columns-campaign",
        "instances": [
          "section.cm-campaign-module.is-large .sl-list"
        ]
      },
      {
        "name": "columns-story",
        "instances": [
          "section.cm-story-module .sl-list"
        ]
      },
      {
        "name": "cards-news",
        "instances": [
          "section.content-hero.has-alt-bg:has(.subheading-news) .sl:has(.subheading-news)"
        ]
      },
      {
        "name": "cards-resource",
        "instances": [
          "section.icare-resources .icare-resources-grid"
        ]
      }
    ],
    "urlPattern": "/",
    "sections": [
      {
        "id": "1",
        "name": "Hero with search",
        "selector": [
          ".hero-banner-container"
        ],
        "style": null,
        "blocks": [
          "hero-home",
          "search-banner"
        ],
        "defaultContent": []
      },
      {
        "id": "2",
        "name": "Audience tiles",
        "selector": [
          "section.all-category-home-tile-wrapper"
        ],
        "style": "grey",
        "blocks": [
          "cards-audience"
        ],
        "defaultContent": []
      },
      {
        "id": "3",
        "name": "I want to... quick links",
        "selector": [
          "section.cta-long-wrapper"
        ],
        "style": "quick-links",
        "blocks": [],
        "defaultContent": [
          "section.cta-long-wrapper .cta-long-section"
        ]
      },
      {
        "id": "4",
        "name": "Feedback and complaints campaign",
        "selector": [
          "section.cm-campaign-module.is-large:has(.sl-list)"
        ],
        "style": "grey",
        "blocks": [
          "columns-campaign"
        ],
        "defaultContent": []
      },
      {
        "id": "5",
        "name": "Safety Speakers Program story",
        "selector": [
          "section.cm-story-module"
        ],
        "style": null,
        "blocks": [
          "columns-story"
        ],
        "defaultContent": []
      },
      {
        "id": "6",
        "name": "News and stories",
        "selector": [
          "section.content-hero.has-alt-bg:has(.subheading-news)"
        ],
        "style": "grey",
        "blocks": [
          "cards-news"
        ],
        "defaultContent": [
          "section.content-hero.has-alt-bg:has(.subheading-news) > .l-padding > h2",
          "section.content-hero.has-alt-bg:has(.subheading-news) > .l-padding > a.cta"
        ]
      },
      {
        "id": "7",
        "name": "Resources",
        "selector": [
          "section.icare-resources"
        ],
        "style": "grey",
        "blocks": [
          "cards-resource"
        ],
        "defaultContent": [
          "section.icare-resources h2.icare-section-title"
        ]
      },
      {
        "id": "8",
        "name": "Acknowledgement of Country",
        "selector": [
          ".ck-content:has(> section.icare-resources) > h3"
        ],
        "style": "grey",
        "blocks": [],
        "defaultContent": [
          ".ck-content:has(> section.icare-resources) > h3",
          ".ck-content:has(> section.icare-resources) > h3 + p"
        ]
      }
    ]
  };
  var transformers = [
    transform,
    ...PAGE_TEMPLATE.sections && PAGE_TEMPLATE.sections.length > 1 ? [transform2] : []
  ];
  function executeTransformers(hookName, element, payload) {
    const enhancedPayload = __spreadProps(__spreadValues({}, payload), {
      template: PAGE_TEMPLATE
    });
    transformers.forEach((transformerFn) => {
      try {
        transformerFn.call(null, hookName, element, enhancedPayload);
      } catch (e) {
        console.error(`Transformer failed at ${hookName}:`, e);
      }
    });
  }
  function findBlocksOnPage(document, template) {
    const pageBlocks = [];
    template.blocks.forEach((blockDef) => {
      blockDef.instances.forEach((selector) => {
        const elements = document.querySelectorAll(selector);
        if (elements.length === 0) {
          console.warn(`Block "${blockDef.name}" selector not found: ${selector}`);
        }
        elements.forEach((element) => {
          pageBlocks.push({
            name: blockDef.name,
            selector,
            element,
            section: blockDef.section || null
          });
        });
      });
    });
    console.log(`Found ${pageBlocks.length} block instances on page`);
    return pageBlocks;
  }
  var import_home_default = {
    transform: (payload) => {
      const { document, url, params } = payload;
      const main = document.body;
      executeTransformers("beforeTransform", main, payload);
      const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);
      pageBlocks.forEach((block) => {
        if (!block.element.parentNode) return;
        const parser = parsers[block.name];
        if (parser) {
          try {
            parser(block.element, { document, url, params });
          } catch (e) {
            console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
          }
        } else {
          console.warn(`No parser found for block: ${block.name}`);
        }
      });
      executeTransformers("afterTransform", main, payload);
      WebImporter.rules.createMetadata(main, document);
      WebImporter.rules.transformBackgroundImages(main, document);
      WebImporter.rules.adjustImageUrls(main, url, params.originalURL);
      const rawPath = new URL(params.originalURL).pathname.replace(/\/$/, "").replace(/\.html?$/, "");
      const path = WebImporter.FileUtils.sanitizePath(rawPath === "" ? "/index" : rawPath);
      return [{
        element: main,
        path,
        report: {
          title: document.title,
          template: PAGE_TEMPLATE.name,
          blocks: pageBlocks.map((b) => b.name)
        }
      }];
    }
  };
  return __toCommonJS(import_home_exports);
})();
