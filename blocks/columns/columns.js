import { loadCSS } from '../../scripts/aem.js';

/**
 * Columns variants implemented as their own block folders (blocks/columns-<variant>/).
 * AEM authoring always renders the columns component as "columns" and expresses variants
 * as block options (classes), e.g. <div class="columns campaign">.
 */
const VARIANTS = ['campaign', 'story'];

/**
 * Hands a variant columns block over to its own decorator and styles.
 * @param {Element} block The columns block element
 * @param {string} variant The variant option found on the block
 */
async function decorateVariant(block, variant) {
  const name = `columns-${variant}`;
  // swap the base class so the generic columns styles don't apply to the variant
  block.classList.replace('columns', name);
  block.classList.remove(variant);
  block.closest('.columns-wrapper')?.classList.add(`${name}-wrapper`);
  block.closest('.section')?.classList.add(`${name}-container`);

  const [mod] = await Promise.all([
    import(`../${name}/${name}.js`),
    loadCSS(`${window.hlx.codeBasePath}/blocks/${name}/${name}.css`),
  ]);
  await mod.default(block);
}

export default async function decorate(block) {
  const variant = VARIANTS.find((v) => block.classList.contains(v));
  if (variant) {
    await decorateVariant(block, variant);
    return;
  }

  const cols = [...block.firstElementChild.children];
  block.classList.add(`columns-${cols.length}-cols`);

  // setup image columns
  [...block.children].forEach((row) => {
    [...row.children].forEach((col) => {
      const pic = col.querySelector('picture');
      if (pic) {
        const picWrapper = pic.closest('div');
        if (picWrapper && picWrapper.children.length === 1) {
          // picture is only content in column
          picWrapper.classList.add('columns-img-col');
        }
      }
    });
  });
}
