<template>
<div class="port-panel">
  <div class="header">
    <div class="bold">Port ID</div>
    <div>{{ portId }}</div>
  </div>
  <hr class="divider">
  <div class="content">
    <slot></slot>
  </div>
</div>
</template>

<style scoped lang="scss" src="./port-panel.scss"></style>

<script lang="ts" src="./port-panel.ts">
</script>
