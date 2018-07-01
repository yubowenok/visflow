import Vue from 'vue';
import store from './store';
import App from './components/app/app';
import $ from 'jquery';

// Global stylesheets
import 'jqueryui/jquery-ui.min.css';
import './override/index.scss';

import { ENVIRONMENT } from './common/env';

Vue.config.productionTip = false;
// Cannot use devtools because of manually/dynamically mounted components.
Vue.config.devtools = false;

new Vue({
  store,
  render: h => h(App),
}).$mount('#app');

if (ENVIRONMENT === 'development') {
  window.$ = $;
}
