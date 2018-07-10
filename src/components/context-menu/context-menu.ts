import { Component, Prop, Vue } from 'vue-property-decorator';
import GlobalClick from '@/directives/global-click';

@Component({
  directives: {
    GlobalClick,
  },
})
export default class ContextMenu extends Vue {
  @Prop()
  private menuProps!: object;

  private topOffset: number = 0;
  private leftOffset: number = 0;
  private visible: boolean = false;

  /**
   * Opens the context menu at the current mouse event position.
   * If the mouse event is on a nested element, the caller should pass in the offset object which is
   * the nested element's global position.
   * [Caution] Most likely the context menu has to be placed globally so that it can appear above
   * all other elements, and using an offset is not necessary. Mount the context menu to a global position instead.
   */
  public open(evt: MouseEvent, offset?: { left: number, top: number }) {
    this.visible = true;
    this.leftOffset = evt.pageX - (offset ? offset.left : 0);
    this.topOffset = evt.pageY - (offset ? offset.top : 0);
  }

  private close() {
    this.visible = false;
  }

  private globalClick(evt: MouseEvent) {
    if (this.$el.contains(evt.target as Element)) {
      return;
    }
    // Closes the ContextMenu if the click is outside the ContextMenu's parent element.
    this.close();
  }

  get styles(): { top: string, left: string } {
    return {
      top: this.topOffset + 'px',
      left: this.leftOffset + 'px',
    };
  }
}
