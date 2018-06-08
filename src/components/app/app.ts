import { Component, Vue } from 'vue-property-decorator';
import { namespace } from 'vuex-class';
import BootstrapVue from 'bootstrap-vue';
import '@/common/jquery-ui';

import AppHeader from '../app-header/app-header';
import ContextMenu from '../context-menu/context-menu';
import NodePanel from '../node-panel/node-panel';
import Visualization from '../visualization/visualization';

const dataflow = namespace('dataflow');

Vue.use(BootstrapVue);

@Component({
  components: {
    AppHeader,
    ContextMenu,
    Visualization,
    NodePanel,
  },
})
export default class App extends Vue {
  @dataflow.Mutation('addNode') private addNode!: () => void;
}
