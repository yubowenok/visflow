import { Component, Vue } from 'vue-property-decorator';
import $ from 'jquery';

import ContextMenu from '../context-menu/context-menu';
import GlobalClick from '../../directives/global-click';
import NodeCover from './node-cover.vue';

const TYPE_NAME = 'node';
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
  /** A list of classes to be added to the container element so that CSS can take effect. */
  protected containerClasses: string[] = [TYPE_NAME];

  protected coverText: string = '';

  public minimize() {
    console.log('node.minimize');
  }

  public maximize() {
    console.log('node.maximize');
  }

  protected mounted() {
    console.log('node mounted');
    $(this.$el).addClass(this.containerClasses);
    $(this.$el).css({
      width: 300,
      height: 300,
      left: 300,
      top: 300,
    });
    $(this.$el)
      .draggable({
        grid: [10, 10],
      })
      .resizable({
        handles: 'all',
        grid: 10,
      });
  }
}
