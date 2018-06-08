import Vuex, { Store } from 'vuex';
import { expect } from 'chai';
import { mount, shallowMount, createLocalVue } from '@vue/test-utils';

import { RootState, defaultStore } from '@/store';
import App from '@/components/app/app';

const localVue = createLocalVue();

localVue.use(Vuex);

describe('app.vue', () => {
  let store: Store<RootState>;

  beforeEach(() => {
    store = new Vuex.Store(defaultStore);
  });

  it('renders entire App', () => {
    const wrapper = mount(App, { store, localVue });
    expect(wrapper.find('#logo').exists()).to.be.true;
  });
});
