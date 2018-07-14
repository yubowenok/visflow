import { injectNodeTemplate } from '@/components/node';
import contextMenuHtml from './context-menu.html';
import enlargeModalHtml from './enlarge-modal.html';

const NODE_CONTENT_REGEX = /\s*<\!--\s*node-content\s*-->\s*[\r\n]+/;
const CONTEXT_MENU_REGEX = /\s*<\!--\s*context-menu\s*-->\s*[\r\n]+/;

/**
 * @param html The template string containing the slot contents for inheriting class of Visualization.
 */
const injectVisualizationTemplate = (html: string): string => {
  let matched = html.match(CONTEXT_MENU_REGEX);
  if (!matched) {
    // The inheriting class's template does not have context-menu defined.
    // Just use Visualization's context menu.
    html += contextMenuHtml;
  } else {
    // Merge the two context menus. The inheriting class's context menu is at the bottom.
    // Insert Visualization's context menu template at the matched position.
    const index = (matched.index as number) + matched[0].length;
    html = html.substr(0, index) + contextMenuHtml + html.substr(index);
  }
  matched = html.match(NODE_CONTENT_REGEX);
  if (!matched) {
    console.error('cannot inject a template without node content');
  } else {
    const index = (matched.index as number) + matched[0].length;
    html = html.substr(0, index) + enlargeModalHtml + html.substr(index);
  }
  return injectNodeTemplate(html);
};

export default injectVisualizationTemplate;
