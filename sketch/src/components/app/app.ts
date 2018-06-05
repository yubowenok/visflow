import { Component, Vue } from 'vue-property-decorator';
import AppHeader from '../app-header/app-header';
import BootstrapVue from 'bootstrap-vue';

import ContextMenu from '../context-menu/context-menu';

Vue.use(BootstrapVue);

@Component({
  components: {
    AppHeader,
    ContextMenu,
  },
})
export default class App extends Vue {
  private items = [{
    id: '1',
    text: 'hello',
  }];

  private menuProps = {
    second: true,
  };

  private firstOption() {
    this.$set(this.menuProps, 'second', !this.menuProps.second);
  }
}
