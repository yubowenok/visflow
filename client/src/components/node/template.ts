import template from './node.html';
import parseTemplate, { TEMPLATE_COMPONENTS } from '@/common/template';

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
  const sections = parseTemplate(html);
  let injectedTemplate = template;
  for (const section of sections) {
    const pattern = TEMPLATE_COMPONENTS.filter(p => p.id === section.id)[0];
    injectedTemplate = injectedTemplate.replace(pattern.regex, section.html);
  }
  return injectedTemplate;
};

export default injectNodeTemplate;
