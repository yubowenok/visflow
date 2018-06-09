import { Component, Vue, Prop } from 'vue-property-decorator';
import $ from 'jquery';

import ContextMenu from '../context-menu/context-menu';
import GlobalClick from '../../directives/global-click';
import NodeCover from './node-cover.vue';

const GRID_SIZE = 10;
@Component({
  components: {
    NodeCover,
    ContextMenu,
  },
  directives: {
    GlobalClick,
  },
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

  /** A list of classes to be added to the container element so that CSS can take effect. */
  protected containerClasses: string[] = [this.NODE_TYPE];

  protected coverText: string = 'node';

  public minimize() {
    console.log('node.minimize');
  }

  public maximize() {
    console.log('node.maximize');
  }

  protected mounted() {
    const $el = $(this.$el);

    $el.draggable({
      grid: [GRID_SIZE, GRID_SIZE],
    });

    if (this.RESIZABLE) {
      $el.resizable({
        handles: 'all',
        grid: GRID_SIZE,
      });
    }

    $el.addClass(this.containerClasses)
    .css({
      width: this.DEFAULT_WIDTH,
      height: this.DEFAULT_HEIGHT,
      left: this.x - this.DEFAULT_WIDTH / 2,
      top: this.y - this.DEFAULT_HEIGHT / 2,
      // jQuery.draggable sets position to relative, we override here.
      position: 'absolute',
    });
  }
}
