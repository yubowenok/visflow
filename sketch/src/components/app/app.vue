<template>
<div id="app">
  <app-header></app-header>
  <div id="canvas" @contextmenu.prevent="$refs.contextMenu.open"></div>
  <context-menu id="context-menu" ref="contextMenu" :menuProps="menuProps">
    <template slot-scope="slotProps">
      <li @click="firstOption">
        <i class="far fa-sm fa-square"></i>
        option 1
      </li>
      <li>
        <i :class="['far fa-sm', slotProps.menuProps.second ? 'fa-check-square' : 'fa-square']"></i>
        option 2
      </li>
      <li class="disabled">
        <i class="far fa-sm fa-square placeholder"></i>
        option 3
      </li>
    </template>
  </context-menu>
</div>
</template>

<style src="./app.scss"></style>

<script src="./app.ts">
</script>
