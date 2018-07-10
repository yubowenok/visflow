import Vue from 'vue';
import $ from 'jquery';

import 'datatables.net';
import 'datatables.net-bs4';
import 'datatables.net-bs4/css/dataTables.bootstrap4.min.css';
import 'datatables.net-select';

// Global stylesheets
import 'jqueryui/jquery-ui.min.css';
import './override/index.scss';

import store from '@/store'; // store must be imported before App
import { ENVIRONMENT } from '@/common/env';
import router from '@/router';
import App from '@/components/app/app';

Vue.config.productionTip = false;
// Cannot use devtools because of manually/dynamically mounted components.
Vue.config.devtools = false;

new Vue({
  store,
  router,
  render: h => h(App),
}).$mount('#app');

if (ENVIRONMENT === 'development') {
  window.$ = $;
}
