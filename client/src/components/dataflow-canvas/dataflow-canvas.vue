<template>
<div id="dataflow-canvas" :class="dragClass">
  <div ref="nodes"></div>
  <div v-if="isSystemInVisMode" id="vis-mode-background"></div>
  <svg ref="edges">
    <drawing-edge v-if="draggedPort"></drawing-edge>
  </svg>
  <div ref="edgeMount"></div>
</div>
</template>

<style scoped src="./dataflow-canvas.scss"></style>

<script lang="ts" src="./dataflow-canvas.ts">
</script>
