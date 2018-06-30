import Vue from 'vue';
import store from './store';
import App from './components/app/app';
import $ from 'jquery';

// Global stylesheets
import 'jqueryui/jquery-ui.min.css';
import './override/index.scss';

Vue.config.productionTip = false;

new Vue({
  store,
  render: h => h(App),
}).$mount('#app');

if (process.env.NODE_ENV === 'development') {
  window.$ = $;
}
