<template>
<div class="dataflow">
  <div ref="nodes"></div>
  <drawing-edge v-if="draggedPort"></drawing-edge>
  <svg ref="edges"></svg>
</div>
</template>

<style scoped src="./dataflow.scss"></style>

<script src="./dataflow.ts">
</script>
