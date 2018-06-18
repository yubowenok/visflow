<template>
<transition name="slide-fade-left">
  <div v-if="visible" class="node-panel">
    <div v-for="(nodeTypeRow, index) in nodeTypeRows" :key="index">
      <div v-for="nodeType in nodeTypeRow"
          :id="nodeType.id"
          :title="nodeType.title"
          :key="nodeType.id"
          class="node-button"
          data-placement="right">
        <img class="square-icon" :src="nodeType.imgSrc"/>
      </div>
    </div>
  </div>
</transition>
</template>

<style scoped src="./node-panel.scss"></style>

<script src="./node-panel.ts">
</script>
