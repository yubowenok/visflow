<template>
<div id="dataflow-canvas" :class="dragClass">
  <div v-if="dragMode === 'select'" class="select-box" :style="selectBoxStyle"></div>
  <div ref="nodes"></div>
  <div v-if="isSystemInVisMode" id="vis-mode-background"></div>
  <svg ref="edges">
    <drawing-edge v-if="draggedPort"></drawing-edge>
  </svg>
  <div ref="edgeMount"></div>
</div>
</template>

<style scoped lang="scss" src="./dataflow-canvas.scss"></style>

<script lang="ts" src="./dataflow-canvas.ts">
</script>
