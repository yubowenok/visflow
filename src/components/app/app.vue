<template>
<div id="app">
  <app-header></app-header>
  <node-panel></node-panel>
  <div id="canvas" @contextmenu.prevent="$refs.contextMenu.open">
    <visualization></visualization>
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

<style src="./app.scss"></style>

<script src="./app.ts">
</script>
