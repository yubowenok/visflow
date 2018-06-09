import { Component, Vue } from 'vue-property-decorator';
import { namespace } from 'vuex-class';
import BootstrapVue from 'bootstrap-vue';
import '@/common/jquery-ui';

import AppHeader from '../app-header/app-header';
import ContextMenu from '../context-menu/context-menu';
import NodePanel from '../node-panel/node-panel';
import Dataflow from '../dataflow/dataflow';

const dataflow = namespace('dataflow');

Vue.use(BootstrapVue);

@Component({
  components: {
    AppHeader,
    ContextMenu,
    NodePanel,
    Dataflow,
  },
})
export default class App extends Vue {
  @dataflow.Mutation('setCanvas') private setCanvas!: (canvas: Vue) => void;

  private mounted() {
    this.setCanvas(this.$refs.dataflow as Vue);
  }

  private addNode() {
    // TODO: add node menu item
  }
}
