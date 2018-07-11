import Vue from 'vue';
import BootstrapVue from 'bootstrap-vue';
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

Vue.use(BootstrapVue);

// Hide the message "You are running Vue in development mode. Make sure to ...".
Vue.config.productionTip = true;

/**
 * Notes with devtools:
 * - Dynamically mounted components (by calling $mount) cannot be listed in devtools.
 * - jQuery draggable callback causes devtools to complain about undefined instance properties/methods that are
 * accessed by jQuery.
 * - Though dynamically mounted components cannot be inspected in devtools, it may be still useful for
 * monitoring vuex store.
 */
// Vue.config.devtools = false;

new Vue({
  store,
  router,
  render: h => h(App),
}).$mount('#app');

if (ENVIRONMENT === 'development') {
  window.$ = $;
}
