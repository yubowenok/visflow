import template from './node.html';

const TEMPLATE_COMPONENTS = [
  {
    id: 'node-content',
    regex: /\s*<\!--\s*node-content\s*-->\s*[\r\n]+/,
  },
  {
    id: 'context-menu',
    regex: /\s*<\!--\s*context-menu\s*-->\s*[\r\n]+/,
  },
  {
    id: 'option-panel',
    regex: /\s*<\!--\s*option-panel\s*-->\s*[\r\n]+/,
  },
];

/**
 * This is a helper function that fills in the "slots" in the node template using the HTML template of the
 * inheriting classes. The content to be replaced includes node-content, context-menu, and option-panel.
 * The placeholder text in HTML comment format like "<!-- node-content -->" is used for replacement.
 * @param html The template string containing the slot contents. It should have three blocks:
 *   1) The node-content block that starts with a line of "<!-- node-content -->";
 *   2) The context-menu block that starts with a line of "<!-- context-menu -->";
 *   3) The option-panel block that starts with a line of "<!-- option-panel -->".
 */
const injectNodeTemplate = (html: string): string => {
  let slots = [html];
  TEMPLATE_COMPONENTS.forEach(pattern => {
    const newSlots: string[] = [];
    slots.forEach(slot => {
      const parts = slot.split(pattern.regex);
      if (parts.length !== 2) {
        newSlots.push(slot);
        return;
      }
      newSlots.push(parts[0]);
      newSlots.push(pattern.id);
      newSlots.push(parts[1]);
    });
    slots = newSlots;
  });
  slots = slots.filter(s => s !== '');
  if (slots.length < TEMPLATE_COMPONENTS.length * 2) {
    console.error('not all node template slots are filled');
  }
  let injectedTemplate = template;
  for (let i = 0; i < slots.length; i += 2) {
    const id = slots[i];
    const content = slots[i + 1];
    const pattern = TEMPLATE_COMPONENTS.filter(p => p.id === id)[0];
    injectedTemplate = injectedTemplate.replace(pattern.regex, content);
  }
  return injectedTemplate;
};

export default injectNodeTemplate;
