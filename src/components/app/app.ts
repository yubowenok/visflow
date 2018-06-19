import { Component, Vue } from 'vue-property-decorator';
import { namespace } from 'vuex-class';
import BootstrapVue from 'bootstrap-vue';
import '@/common/jquery-ui';

import AppHeader from '../app-header/app-header';
import SystemMessage from '../system-message/system-message';
import ContextMenu from '../context-menu/context-menu';
import NodePanel from '../node-panel/node-panel';
import Dataflow from '../dataflow/dataflow';

const dataflow = namespace('dataflow');
const panels = namespace('panels');
const contextMenu = namespace('contextMenu');

Vue.use(BootstrapVue);

@Component({
  components: {
    AppHeader,
    SystemMessage,
    ContextMenu,
    NodePanel,
    Dataflow,
  },
})
export default class App extends Vue {
  @dataflow.Mutation('setCanvas') private setCanvas!: (canvas: Vue) => void;
  @panels.Mutation('setOptionPanelMount') private setOptionPanelMount!: (mount: Vue) => void;
  @panels.Mutation('setPortPanelMount') private setPortPanelMount!: (mount: Vue) => void;
  @contextMenu.Mutation('setMount') private setContextMenuMount!: (mount: Vue) => void;

  private mounted() {
    this.setCanvas(this.$refs.dataflow as Vue);
    this.setOptionPanelMount(this.$refs.optionPanelMount as Vue);
    this.setPortPanelMount(this.$refs.portPanelMount as Vue);
    this.setContextMenuMount(this.$refs.contextMenuMount as Vue);
  }

  private addNode() {
    // TODO: add node menu item
  }
}
