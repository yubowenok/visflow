<template>
<div class="bar">
  <b-button ref="button" size="sm" variant="outline-secondary" @click="$refs.datasetPanel.open()">
    <i class="fas fa-database"></i>
  </b-button>
  <b-tooltip :target="() => $refs.button" placement="bottom" delay="500">Manage Datasets</b-tooltip>
  <dataset-panel ref="datasetPanel" :selectable="false"></dataset-panel>
</div>
</template>

<script src="./dataset-bar.ts">
</script>
