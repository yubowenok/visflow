<template>
<div class="option-panel">
  <div class="header">
    <b-button @click="toggleIconized" size="sm" :pressed.sync="isIconized"><i class="fas fa-expand"></i></b-button>
    <b-button @click="toggleInVisMode" size="sm" :pressed.sync="isInVisMode"><i class="fas fa-tv"></i></b-button>
    <b-button @click="toggleLabelVisible" size="sm" :pressed.sync="isLabelVisible"><i class="fas fa-tag"></i></b-button>
  </div>
  <div class="divider"></div>
  <div class="content">
    <slot></slot>
  </div>
</div>
</template>

<style scoped src="./option-panel.scss"></style>

<script src="./option-panel.ts">
</script>
