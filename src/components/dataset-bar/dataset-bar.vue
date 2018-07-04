<template>
<div class="bar">
  <b-button size="sm" variant="outline-secondary" @click="$refs.datasetPanel.open()">
    <i class="fas fa-database"></i>
  </b-button>
  <dataset-panel ref="datasetPanel" :selectable="false"></dataset-panel>
</div>
</template>

<script src="./dataset-bar.ts">
</script>
