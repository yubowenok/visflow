import { injectNodeTemplate } from '@/components/node';
import template from './visualization.html';

const CONTEXT_MENU_REGEX = /\s*<\!--\s*context-menu\s*-->\s*[\r\n]+/;
/**
 * @param html The template string containing the slot contents for inheriting class of Visualization.
 */
const injectVisualizationTemplate = (html: string): string => {
  const matched = html.match(CONTEXT_MENU_REGEX);
  if (!matched) {
    // The inheriting class's template does not have context-menu defined.
    // Just use Visualization's context menu.
    return injectNodeTemplate(html + template);
  }
  // Merge the two context menus. The inheriting class's context menu is at the bottom.
  // Insert Visualization's context menu template at the matched position.
  const index = (matched.index as number) + matched[0].length;
  return injectNodeTemplate(html.substr(0, index) + template + html.substr(index));
};

export default injectVisualizationTemplate;
