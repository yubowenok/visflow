declare global {
  interface Window {
    $: JQueryStatic;
  }
}

export {}; // make this file a module otherwise we cannot "declare global"
