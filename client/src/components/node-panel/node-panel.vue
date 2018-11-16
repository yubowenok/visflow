<template>
<transition name="slide-fade-left">
  <div class="node-panel" v-if="isVisible">
    <node-list
      :nodeTypes="useBetaFeatures ? nodeTypes : nodeTypes.filter(type => !type.isBeta)"
      :nodeTypesPerRow="useBetaFeatures ? 3 : 2"
    >
    </node-list>
  </div>
</transition>
</template>

<style scoped src="./node-panel.scss"></style>

<script lang="ts" src="./node-panel.ts">
</script>
