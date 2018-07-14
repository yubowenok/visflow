<template>
<div id="app" @contextmenu.prevent>
  <app-header></app-header>
  <system-message></system-message>
  <node-panel></node-panel>
  <quick-node-panel></quick-node-panel>
  <div id="canvas" @contextmenu.prevent.stop="$refs.contextMenu.open">
    <dataflow-canvas ref="dataflowCanvas"></dataflow-canvas>
  </div>
  <div ref="optionPanelMount"></div>
  <div ref="portPanelMount"></div>
  <div ref="contextMenuMount"></div>
  <div ref="nodeModalMount"></div>
  <context-menu id="context-menu" ref="contextMenu">
    <template slot-scope="slotProps">
      <li @click="addNode">
        <i class="fas fa-sm fa-plus"></i>Add Node<span class="shortcut">A</span>
      </li>
    </template>
  </context-menu>
</div>
</template>

<!-- App styles are not scoped because they may affect body and html -->
<style src="./app.scss"></style>

<!-- [Note!] 'lang="ts"' is required for jest test to properly transform vue component with vue-property-decorator. -->
<script lang="ts" src="./app.ts">
</script>
