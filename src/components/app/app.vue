<template>
<div id="app" @contextmenu.prevent>
  <app-header></app-header>
  <node-panel></node-panel>
  <div id="canvas" @contextmenu.prevent.stop="$refs.contextMenu.open">
    <dataflow ref="dataflow"></dataflow>
  </div>
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
