/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import heroHomeParser from './parsers/hero-home.js';
import searchBannerParser from './parsers/search-banner.js';
import cardsAudienceParser from './parsers/cards-audience.js';
import columnsCampaignParser from './parsers/columns-campaign.js';
import columnsStoryParser from './parsers/columns-story.js';
import cardsNewsParser from './parsers/cards-news.js';
import cardsResourceParser from './parsers/cards-resource.js';

// TRANSFORMER IMPORTS
import icareCleanupTransformer from './transformers/icare-cleanup.js';
import icareSectionsTransformer from './transformers/icare-sections.js';

// PARSER REGISTRY
const parsers = {
  'hero-home': heroHomeParser,
  'search-banner': searchBannerParser,
  'cards-audience': cardsAudienceParser,
  'columns-campaign': columnsCampaignParser,
  'columns-story': columnsStoryParser,
  'cards-news': cardsNewsParser,
  'cards-resource': cardsResourceParser,
};

// PAGE TEMPLATE CONFIGURATION - Embedded from page-templates.json
const PAGE_TEMPLATE = {
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

// TRANSFORMER REGISTRY - cleanup first, then sections (needs 2+ sections)
const transformers = [
  icareCleanupTransformer,
  ...(PAGE_TEMPLATE.sections && PAGE_TEMPLATE.sections.length > 1 ? [icareSectionsTransformer] : []),
];

/**
 * Execute all page transformers for a specific hook
 * @param {string} hookName - 'beforeTransform' or 'afterTransform'
 * @param {Element} element - The DOM element to transform
 * @param {Object} payload - { document, url, html, params }
 */
function executeTransformers(hookName, element, payload) {
  const enhancedPayload = {
    ...payload,
    template: PAGE_TEMPLATE,
  };

  transformers.forEach((transformerFn) => {
    try {
      transformerFn.call(null, hookName, element, enhancedPayload);
    } catch (e) {
      console.error(`Transformer failed at ${hookName}:`, e);
    }
  });
}

/**
 * Find all blocks on the page based on the embedded template configuration
 * @param {Document} document - The DOM document
 * @param {Object} template - The embedded PAGE_TEMPLATE object
 * @returns {Array} Block instances found on the page
 */
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
          section: blockDef.section || null,
        });
      });
    });
  });

  console.log(`Found ${pageBlocks.length} block instances on page`);
  return pageBlocks;
}

export default {
  transform: (payload) => {
    const { document, url, params } = payload;

    const main = document.body;

    // 1. Initial cleanup + section breaks
    executeTransformers('beforeTransform', main, payload);

    // 2. Find blocks on page using embedded template
    const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);

    // 3. Parse each block; skip elements already replaced by an earlier parser
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

    // 4. Final cleanup + section metadata
    executeTransformers('afterTransform', main, payload);

    // 5. WebImporter built-in rules
    const hr = document.createElement('hr');
    main.appendChild(hr);
    WebImporter.rules.createMetadata(main, document);
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

    // 6. Sanitized path; root URL maps to /index
    const rawPath = new URL(params.originalURL).pathname
      .replace(/\/$/, '')
      .replace(/\.html?$/, '');
    const path = WebImporter.FileUtils.sanitizePath(rawPath === '' ? '/index' : rawPath);

    return [{
      element: main,
      path,
      report: {
        title: document.title,
        template: PAGE_TEMPLATE.name,
        blocks: pageBlocks.map((b) => b.name),
      },
    }];
  },
};
