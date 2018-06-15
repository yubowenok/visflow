import { Component, Vue } from 'vue-property-decorator';
import { namespace } from 'vuex-class';
import BootstrapVue from 'bootstrap-vue';
import '@/common/jquery-ui';

import AppHeader from '../app-header/app-header';
import SystemMessage from '../system-message/system-message';
import ContextMenu from '../context-menu/context-menu';
import NodePanel from '../node-panel/node-panel';
import Dataflow from '../dataflow/dataflow';
import { MessageOptions } from '@/store/message';

const dataflow = namespace('dataflow');
const message = namespace('message');

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
  @message.Mutation('showMessage') private showMessage!: (options: MessageOptions) => void;

  private mounted() {
    this.setCanvas(this.$refs.dataflow as Vue);
  }

  private addNode() {
    // TODO: add node menu item
  }
}
