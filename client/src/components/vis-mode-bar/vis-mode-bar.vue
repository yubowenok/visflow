<template>
<div class="bar">
  <b-button id="toggle" ref="button" size="sm" variant="outline-secondary" :pressed="isSystemInVisMode" @click="toggle">
    <i class="fas fa-video"></i>
  </b-button>
  <b-tooltip :target="() => $el" placement="bottom" delay="500">Visualization Mode</b-tooltip>
</div>
</template>

<style scoped src="./vis-mode-bar.scss"></style>

<script lang="ts" src="./vis-mode-bar.ts">
</script>
