/// <reference path="../../node_modules/@types/jqueryui/index.d.ts" />

declare global {
  interface Window {
    $: JQueryStatic;
  }
}

export {}; // make this file a module otherwise we cannot "declare global"
