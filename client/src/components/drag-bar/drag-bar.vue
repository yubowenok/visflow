<template>
<div class="bar">
  <b-button ref="button" id="toggle"
    size="sm" variant="outline-secondary" :pressed="isAltPressed" @click="toggle">
    <i class="fas fa-arrows-alt"></i>
  </b-button>
  <b-tooltip :target="() => $refs.button" placement="bottom" delay="500">
    Drag Mode
    <span class="shortcut">Alt</span>
  </b-tooltip>
</div>
</template>

<style scoped lang="scss" src="./drag-bar.scss"></style>

<script lang="ts" src="./drag-bar.ts">
</script>
