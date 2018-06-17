<template>
<div class="dataflow">
  <div ref="nodes"></div>
  <svg ref="edges">
    <drawing-edge v-if="draggedPort"></drawing-edge>
  </svg>
</div>
</template>

<style scoped src="./dataflow.scss"></style>

<script src="./dataflow.ts">
</script>
