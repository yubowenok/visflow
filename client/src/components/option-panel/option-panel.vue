<template>
<div class="option-panel">
  <div class="header">
    <div class="node-id"><span class="bold">Label: </span>
      <editable-text v-model="label" @input="onLabelChange"></editable-text>
    </div>
    <hr class="divider">
    <b-button @click="toggleIconized" size="sm" :pressed="isIconized" variant="outline-secondary" class="mini"
      :disabled="isSystemInVisMode"
    >
      <i class="fas fa-expand"></i>
    </b-button>
    <b-button @click="toggleInVisMode" size="sm" :pressed="isInVisMode" variant="outline-secondary" class="mini">
      <i class="fas fa-tv"></i>
    </b-button>
    <b-button @click="toggleLabelVisible" size="sm" :pressed="isLabelVisible" variant="outline-secondary" class="mini">
      <i class="fas fa-tag"></i>
    </b-button>
    <b-button v-if="enlargeable" @click="enlarge" size="sm" variant="outline-secondary" class="mini">
      <i class="fas fa-search-plus"></i>
    </b-button>
    <b-button v-if="hasSettings" @click="settings" size="sm" variant="outline-secondary" class="mini">
      <i class="fas fa-cog"></i>
    </b-button>
  </div>
  <hr class="divider">
  <div class="content">
    <slot></slot>
  </div>
</div>
</template>

<style scoped lang="scss" src="./option-panel.scss"></style>

<script lang="ts" src="./option-panel.ts">
</script>
