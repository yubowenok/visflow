import { Component, Vue } from 'vue-property-decorator';
import { TweenLite } from 'gsap';
import $ from 'jquery';

import { getImgSrc } from '@/store/dataflow/node-types';
import { DEFAULT_ANIMATION_DURATION } from '@/common/constants';
import ContextMenu from '../context-menu/context-menu';
import GlobalClick from '../../directives/global-click';
import NodeCover from './node-cover.vue';
import OptionPanel from '../option-panel/option-panel';
import template from './node.html';

const GRID_SIZE = 10;
@Component({
  components: {
    NodeCover,
    ContextMenu,
    OptionPanel,
  },
  directives: {
    GlobalClick,
  },
  template,
})
export default class Node extends Vue {
  protected NODE_TYPE: string = 'node';
  protected DEFAULT_WIDTH: number = 50;
  protected DEFAULT_HEIGHT: number = 50;
  protected RESIZABLE: boolean = false;

  protected id: string = '';

  // layout
  protected x: number = 0;
  protected y: number = 0;
  protected isActive: boolean = false;
  protected isIconized: boolean = false;
  protected isInVisMode: boolean = false;
  protected isLabelVisible: boolean = false;

  /** A list of classes to be added to the container element so that CSS can take effect. */
  protected containerClasses: string[] = [this.NODE_TYPE];

  protected coverText: string = '(node)';

  public minimize() {
    console.log('node.minimize');
  }

  public maximize() {
    console.log('node.maximize');
  }

  /**
   * Makes the node activated. This is typically triggered by mouse click.
   */
  public activate() {
    console.log('activate');
    this.isActive = true;
  }

  protected mounted() {
    this.initEventListeners();

    const $node = $(this.$refs.node);

    $node.draggable({
      grid: [GRID_SIZE, GRID_SIZE],
    });

    if (this.RESIZABLE) {
      $node.resizable({
        handles: 'all',
        grid: GRID_SIZE,
      });
    }

    $node.addClass(this.containerClasses)
      .css({
        width: this.DEFAULT_WIDTH,
        height: this.DEFAULT_HEIGHT,
        left: this.x - this.DEFAULT_WIDTH / 2,
        top: this.y - this.DEFAULT_HEIGHT / 2,
        // jQuery.draggable sets position to relative, we override here.
        position: 'absolute',
      });

    TweenLite.from($node[0], DEFAULT_ANIMATION_DURATION, {
      scale: 1.5,
    });

    console.log('mounted', this.NODE_TYPE);
  }

  protected created() {
    console.log('created node');
  }

  private clicked() {
    this.activate();
  }

  private globalClick(evt: MouseEvent) {
    if (this.$el.contains(evt.target as Element)) {
      return;
    }
    this.deactivate();
  }

  private deactivate() {
    console.log('deactivate');
    this.isActive = false;
  }

  /**
   * Sets up common hooks such as mouse click handlers.
   */
  private initEventListeners() {
    $(this.$refs.node)
      .on('click', this.clicked)
      .on('contextmenu', (evt: Event) => {
        evt.stopPropagation();
        evt.preventDefault();
        (this.$refs.contextMenu as ContextMenu).open(evt as MouseEvent);
      });
  }

  /**
   * Destroys all event listeners created outside vue.
   */
  private beforeDestroy() {
    $(this.$refs.node)
      .off('click')
      .off('contextmenu');
  }

  private onToggleIconized(val: boolean) {
    console.log('tg', val);
  }

  get optionPanelInitState() {
    return {
      isIconized: this.isIconized,
      isInVisMode: this.isInVisMode,
      isLabelVisible: this.isLabelVisible,
    };
  }
}

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
 * inheritting classes. The content to be replaced includes node-content, context-menu, and option-panel.
 * The placeholder text in HTML comment format like "<!-- node-content -->" is used for replacement.
 * @param html The template string containing the slot contents. It should have three blocks:
 *   1) The node-content block that starts with a line of "<!-- node-content -->";
 *   2) The context-menu block that starts with a line of "<!-- context-menu -->";
 *   3) The option-panel block that starts with a line of "<!-- option-panel -->".
 */
export const injectNodeTemplate = (html: string): string => {
  // template.replace('<!-- node-content -->', )
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
