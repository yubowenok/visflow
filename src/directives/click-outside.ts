import Vue, { VNodeDirective } from 'vue';

let handler: (evt: MouseEvent) => void;

export default Vue.directive('click-outside', {
  bind(el: Element, binding: VNodeDirective) {
    handler = (evt: MouseEvent) => binding.value(evt, el);
    document.body.addEventListener('click', handler);
  },
  unbind(el: Element, binding: VNodeDirective) {
    document.body.removeEventListener('click', handler);
  },
});
