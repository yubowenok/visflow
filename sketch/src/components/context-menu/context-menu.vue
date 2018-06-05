<template>
<div class="context-menu"
     v-if="visible"
     :style="styles"
     @click="close"
     @contextmenu.prevent
     v-click-outside="clickOutside"
     >
  <slot :menuProps="menuProps"></slot>
</div>
</template>

<style scoped src="./context-menu.scss"></style>

<script src="./context-menu.ts">
</script>
