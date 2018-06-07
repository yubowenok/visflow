import Vue from 'vue';
import Vuex, { Store } from 'vuex';
import { expect } from 'chai';
import { mount, shallowMount, createLocalVue } from '@vue/test-utils';

import app from '@/components/app/app';
import { RootState, defaultStore } from '@/store';

const localVue = createLocalVue();

localVue.use(Vuex);

describe('app.vue', () => {
  let store: Store<RootState>;

  beforeEach(() => {
    store = new Vuex.Store(defaultStore);
  });

  it('renders entire App', () => {
    const wrapper = mount(app, { store, localVue });
    expect(wrapper.find('#logo').exists()).to.be.true;
  });
});
