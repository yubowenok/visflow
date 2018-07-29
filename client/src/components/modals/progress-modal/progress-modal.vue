<template>
<div v-if="inProgress">
  <b-progress id="progress">
    <b-progress-bar :value="progressPercentage" :label="label"></b-progress-bar>
  </b-progress>
  <div class="modal-backdrop custom"></div>
</div>
</template>

<style scoped lang="scss">
@import '../../../common/style/index';

#progress {
  z-index: $zIndexProgressModalProgressBar;
  bottom: $icon-size;
  right: $icon-size;
  position: absolute;
  width: 25%;
}
</style>

<script lang="ts" src="./progress-modal.ts">
</script>
