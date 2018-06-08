import { Component, Prop, Vue } from 'vue-property-decorator';
import GlobalClick from '../../directives/global-click';

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

  private open(e: MouseEvent) {
    this.visible = true;
    this.topOffset = e.pageY;
    this.leftOffset = e.pageX;
  }

  private close() {
    this.visible = false;
  }

  private globalClick(evt: MouseEvent) {
    if (this.$el.contains(evt.target as Node)) {
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
