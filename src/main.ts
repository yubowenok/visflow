import Vue from 'vue';
import store from './store';
import App from './components/app/app';

// Global stylesheets
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-vue/dist/bootstrap-vue.min.css';
import './override/bootstrap.scss';

Vue.config.productionTip = false;

new Vue({
  store,
  render: h => h(App),
}).$mount('#app');
