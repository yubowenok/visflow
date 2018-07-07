import { Component, Vue } from 'vue-property-decorator';
import BootstrapVue from 'bootstrap-vue';
import '@/common/jquery-ui';
import $ from 'jquery';

import AppHeader from '../app-header/app-header';
import SystemMessage from '../system-message/system-message';
import ContextMenu from '../context-menu/context-menu';
import NodePanel from '../node-panel/node-panel';
import DataflowCanvas from '../dataflow-canvas/dataflow-canvas';
import ns from '@/common/namespaces';

Vue.use(BootstrapVue);

@Component({
  components: {
    AppHeader,
    SystemMessage,
    ContextMenu,
    NodePanel,
    DataflowCanvas,
  },
})
export default class App extends Vue {
  @ns.dataflow.Mutation('setCanvas') private setCanvas!: (canvas: Vue) => void;
  @ns.panels.Mutation('setOptionPanelMount') private setOptionPanelMount!: (mount: Vue) => void;
  @ns.panels.Mutation('setPortPanelMount') private setPortPanelMount!: (mount: Vue) => void;
  @ns.contextMenu.Mutation('setMount') private setContextMenuMount!: (mount: Vue) => void;
  @ns.interaction.Mutation('keydown') private interactionKeydown!: (key: string) => void;
  @ns.interaction.Mutation('keyup') private interactionKeyup!: (key: string) => void;

  private mounted() {
    this.setCanvas(this.$refs.dataflowCanvas as Vue);
    this.setOptionPanelMount(this.$refs.optionPanelMount as Vue);
    this.setPortPanelMount(this.$refs.portPanelMount as Vue);
    this.setContextMenuMount(this.$refs.contextMenuMount as Vue);

    this.initKeyHandlers();
  }

  /** Adds event handlers to global keystrokes. */
  private initKeyHandlers() {
    $(document)
      .keydown(this.onKeydown)
      .keyup(this.onKeyup);
  }

  private removeKeyHandlers() {
    $(document)
      .off('keydown', this.onKeydown)
      .off('keyup', this.onKeyup);
  }

  private onKeydown(evt: JQuery.Event) {
    if (!evt.key) {
      // On initial mouse click, form-control keydown event (from modal)
      // may be bubbled up without key value set...
      return;
    }
    this.interactionKeydown(evt.key as string);
  }

  private onKeyup(evt: JQuery.Event) {
    if (!evt.key) {
      return;
    }
    this.interactionKeyup(evt.key as string);
  }

  private addNode() {
    // TODO: add node menu item
  }

  private beforeDestroy() {
    this.removeKeyHandlers();
  }
}
