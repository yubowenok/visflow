<template>
<div id="app" @contextmenu.prevent>
  <app-header></app-header>
  <system-message></system-message>
  <node-panel></node-panel>
  <div id="canvas" @contextmenu.prevent.stop="$refs.contextMenu.open">
    <dataflow ref="dataflow"></dataflow>
  </div>
  <div id="option-panel-mount" ref="optionPanelMount"></div>
  <div id="port-panel-mount" ref="portPanelMount"></div>
  <div id="context-menu-mount" ref="contextMenuMount"></div>
  <context-menu id="context-menu" ref="contextMenu">
    <template slot-scope="slotProps">
      <li @click="addNode">
        <i class="fas fa-sm fa-plus"></i>
        Add Node
      </li>
    </template>
  </context-menu>
</div>
</template>

<!-- App styles are not scoped because they may affect body and html -->
<style src="./app.scss"></style>

<script src="./app.ts">
</script>
