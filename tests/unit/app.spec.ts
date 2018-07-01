import Vuex, { Store } from 'vuex';
import { expect } from 'chai';
import { mount, shallowMount, createLocalVue, TransitionStub, TransitionGroupStub } from '@vue/test-utils';

import { RootState, defaultStore } from '@/store';
import App from '@/components/app/app';

const localVue = createLocalVue();

localVue.use(Vuex);

describe('app', () => {
  let store: Store<RootState>;

  beforeEach(() => {
    store = new Vuex.Store(defaultStore);

  });

  it('renders entire App', () => {
    const wrapper = mount(App, {
      store,
      localVue,
      stubs: {
        'system-message': '<div/>', // contains transition that breaks test after animation
        'transition': TransitionStub,
        'transition-group': TransitionGroupStub,
      },
    });
    expect(wrapper.find('#logo').exists()).to.be.true;
  });
});
