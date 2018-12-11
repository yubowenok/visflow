import { VNodeDirective } from 'vue';

interface CustomElement extends Element {
  handler: (evt: MouseEvent) => void;
}

export default {
  bind(el: Element, binding: VNodeDirective) {
    // Stores the handler under the HTML element so that it can be safely removed.
    const elCustom: CustomElement = el as CustomElement;
    elCustom.handler = (evt: MouseEvent) => binding.value(evt, el);
    // Listens to the mouse actions at the capturing phase.
    // Otherwise, the event will be stopped at the containing element and not bubbled to HTML body.
    document.body.addEventListener('mousedown', elCustom.handler, true);
    document.body.addEventListener('contextmenu', elCustom.handler, true);
  },
  unbind(el: Element, binding: VNodeDirective) {
    const elCustom: CustomElement = el as CustomElement;
    document.body.removeEventListener('mousedown', elCustom.handler, true);
    document.body.removeEventListener('contextmenu', elCustom.handler, true);
  },
};
