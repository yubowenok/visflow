import Vue from 'vue';
import Router from 'vue-router';
import App from '@/components/app/app';

Vue.use(Router);

const routes = [
  { path: '/share/:link', component: App },
  { path: '/diagram/:filename/log', name: 'log', component: App },
  { path: '/diagram/:filename', name: 'diagram', component: App },
  { path: '*', component: App },
];

const router = new Router({
  mode: 'history',
  base: process.env.BASE_URL || '/',
  routes,
});

export default router;
