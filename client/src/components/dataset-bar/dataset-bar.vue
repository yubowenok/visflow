<template>
<div class="bar">
  <b-button ref="button" size="sm" variant="outline-secondary" @click="$refs.datasetModal.open()">
    <i class="fas fa-database"></i>
  </b-button>
  <b-tooltip :target="() => $refs.button" placement="bottom" delay="500">Manage Datasets</b-tooltip>
  <dataset-modal ref="datasetModal" :selectable="false"></dataset-modal>
</div>
</template>

<script lang="ts" src="./dataset-bar.ts">
</script>
