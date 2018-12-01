export const TEMPLATE_COMPONENTS = [
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
  {
    id: 'settings',
    regex: /\s*<\!--\s*settings-modal\s*-->\s*[\r\n]+/,
  },
];

interface TemplateSection {
  id: string;
  html: string;
}

const parseTemplate = (html: string): TemplateSection[] => {
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
  const result: TemplateSection[] = [];
  for (let i = 0; i < slots.length; i += 2) {
    result.push({
      id: slots[i],
      html: slots[i + 1],
    });
  }
  return result;
};

export default parseTemplate;
