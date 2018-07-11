<template>
<transition name="slide-fade-top">
  <div class="context-menu"
      v-if="visible"
      :style="styles"
      @click="close"
      @contextmenu.prevent.stop
      v-global-click="globalClick"
      >
    <slot :menuProps="menuProps"></slot>
  </div>
</transition>
</template>

<style scoped src="./context-menu.scss"></style>

<script lang="ts" src="./context-menu.ts">
</script>
