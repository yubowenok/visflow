<template>
<div class="bar">
  <b-button ref="button" size="sm" variant="outline-secondary" @click="saveDiagram">
    <i class="fas fa-file"></i>
    <span class="diagram-name" v-if="diagramName">{{ diagramName }}</span>
  </b-button>
  <b-tooltip :target="() => $el" placement="bottom" delay="500">
    <div v-if="diagramName">Save diagram "{{ diagramName }}"</div>
    <div v-else>Save a new diagram</div>
  </b-tooltip>
</div>
</template>

<style scoped lang="scss">
@import '../../common/style/index';

.diagram-name {
  margin-left: $margin-size;
}
</style>

<script lang="ts" src="./diagram-bar.ts">
</script>
