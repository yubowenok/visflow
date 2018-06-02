import { expect } from 'chai';
import { mount, shallowMount } from '@vue/test-utils';
import app from '@/components/app/app';
import Vue from 'vue';

describe('app.vue', () => {
  it('renders entire App', () => {
    const wrapper = mount(app);
    expect(wrapper.find('#logo').exists()).to.be.true;
  });
});
