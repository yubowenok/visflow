import Vue from 'vue';
import AppHeader from '../app-header/app-header';
import BootstrapVue from 'bootstrap-vue';

Vue.use(BootstrapVue);

export default Vue.extend({
  name: 'app',
  components: {
    AppHeader,
  },
});
