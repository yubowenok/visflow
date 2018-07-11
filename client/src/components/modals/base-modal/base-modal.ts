import { Vue, Component, Prop } from 'vue-property-decorator';

@Component
export default class BaseModal extends Vue {
  @Prop({
    default: () => {},
  })
  private onOpen!: () => {};
  @Prop({
    default: () => {},
  })
  private onClose!: () => {};
  @Prop({
    default: () => {},
  })
  private onEnter!: () => {};

  @Prop()
  private visibleState!: boolean;
  @Prop()
  private title!: string;
  @Prop({
    default: true,
  })
  private resetErrorOnClose!: boolean;

  private error = ''; // Error message received from the parent component

  /**
   * "visible" controls whether the modal is open and is synced with a global store's state boolean.
   * This linked state should be defined in the inheriting modal using:
   *     @ns.modals.State({stateBoolean}) private storeState!: boolean;
   */
  get visible(): boolean {
    return this.visibleState;
  }
  set visible(value: boolean) {
    if (this.visible === value) {
      return;
    }
    if (value) {
      this.onOpen();
    } else {
      this.onClose();
    }
  }

  public close() {
    if (this.resetErrorOnClose) {
      this.error = '';
    }
    this.visible = false;
  }

  public errorHandler(err: string) {
    this.error = err;
  }
}
