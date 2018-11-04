<template>
<div class="bar">
  <span class="v-divider">|</span>
  <b-button id="show-modal" size="sm" variant="outline-secondary" @click="openExperimentModal">
    User Study
  </b-button>
  <span class="v-divider">|</span>
</div>
</template>

<style scoped lang="scss">
@import '../../common/style/index';

#show-modal {
  margin-left: $margin-size-sm;
}

.v-divider {
  color: #ccc;
  margin: $margin-size;
}
</style>

<script lang="ts" src="./experiment-bar.ts">
</script>
