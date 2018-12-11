<template>
<div class="node-list">
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
</template>

<style scoped lang="scss" src="./node-list.scss"></style>

<script lang="ts" src="./node-list.ts">
</script>
