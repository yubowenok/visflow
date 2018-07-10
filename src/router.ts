import Vue from 'vue';
import Router from 'vue-router';
import App from '@/components/app/app';

Vue.use(Router);

const routes = [
  { path: '/share/:link', component: App },
  { path: '/diagram/:filename', component: App },
  { path: '*', component: App },
];

export default new Router({
  mode: 'history',
  routes,
});
