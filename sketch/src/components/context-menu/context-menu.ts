import { Component, Prop, Vue } from 'vue-property-decorator';
import ClickOutside from '../../directives/click-outside';

@Component({
  directives: {
    ClickOutside,
  },
})
export default class ContextMenu extends Vue {
  @Prop()
  private items!: Array<{ id: string, text: string }>;

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

  private clickOutside(evt: MouseEvent) {
    if (this.$el.contains(evt.target as Node)) {
      return;
    }
    this.close();
  }

  get styles() {
    return {
      top: this.topOffset + 'px',
      left: this.leftOffset + 'px',
    };
  }
}
