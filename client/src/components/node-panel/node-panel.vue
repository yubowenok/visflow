<template>
<transition name="slide-fade-left">
  <div class="node-panel">
    <node-list :nodeTypes="nodeTypes"></node-list>
  </div>
</transition>
</template>

<style scoped src="./node-panel.scss"></style>

<script lang="ts" src="./node-panel.ts">
</script>
