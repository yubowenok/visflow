import { Component, Vue } from 'vue-property-decorator';
import AppHeader from '../app-header/app-header';
import BootstrapVue from 'bootstrap-vue';

Vue.use(BootstrapVue);

@Component({
  components: {
    AppHeader,
  },
})
export default class App extends Vue {
}
