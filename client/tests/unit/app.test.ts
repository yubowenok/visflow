/**
 * @fileOverview Ensures that the app can be shallow mounted with store and router.
 * Currently this does not ensure that all child components are mounted correctly.
 *
 * We have to import component from *.vue and get rid of typescript error using @ts-ignore for now.
 * If we want all child components to render correctly we must also use *.vue in ts files.
 * We will wait for a support of separation of concerns:
 *     https://github.com/vuejs/vue-cli/issues/1576
 */
import VueTestUtils, { shallowMount } from '@vue/test-utils';

VueTestUtils.config.logModifiedComponents = false;

/**
 * [Note!] Must use *.vue instead of *.ts.
 * app/app, app/app.ts will not work and will cause "Maximum call stack size exceeded".
 */
// @ts-ignore
import App from '@/components/app/app.vue';

import store from '@/store';
import router from '@/router';

describe('app', () => {
  it('renders entire App', () => {
    const wrapper = shallowMount(App, {
      router,
      store,
    });
    expect(wrapper.find('#canvas').exists()).toBe(true);
  });
});
