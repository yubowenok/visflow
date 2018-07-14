import { VNodeDirective } from 'vue';

interface CustomElement extends Element {
  handler: (evt: Event) => void;
}

export default {
  bind(el: Element, binding: VNodeDirective) {
    // Stores the handler under the HTML element so that it can be safely removed.
    const elCustom: CustomElement = el as CustomElement;
    elCustom.handler = (evt: Event) => binding.value(evt, el);
    window.addEventListener('resize', elCustom.handler);
  },
  unbind(el: Element, binding: VNodeDirective) {
    const elCustom: CustomElement = el as CustomElement;
    window.removeEventListener('resize', elCustom.handler);
  },
};
