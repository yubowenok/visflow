<template>
<div class="bar">
  <b-button ref="button" size="sm" variant="outline-secondary" @click="toggleInput">
    <i class="fas fa-keyboard"></i>
  </b-button>
  <b-tooltip :target="() => $refs.button" placement="bottom" delay="500">
    FlowSense <span class="shortcut">⇧S</span>
  </b-tooltip>
</div>
</template>

<script lang="ts" src="./flowsense-bar.ts">
</script>
