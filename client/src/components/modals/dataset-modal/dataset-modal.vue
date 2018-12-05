<template>
<base-modal ref="modal" title="Dataset"
  :visible-state="visible"
  :on-open="open"
  :on-close="close"
  >
  <template slot="content">
    <file-upload v-if="!isInExperiment" ref="fileUpload" url="/dataset/upload" field="dataset"
      @uploaded="onFileUpload">
    </file-upload>
    <div class="list">
      <h5>Your Datasets</h5>
      <dataset-list ref="datasetList" :selectable="selectable"
        @selectDataset="onDatasetListSelect"
        @deselectDataset="onDatasetListDeselect"
      ></dataset-list>
    </div>
  </template>
  <template slot="footer">
    <div v-if="selectable">
      <b-btn variant="outline-secondary" @click="close">Cancel</b-btn>
      <b-btn variant="outline-success" @click="selectDataset" :disabled="!datasetSelected">OK</b-btn>
    </div>
  </template>
</base-modal>
</template>

<style scoped lang="scss" src="./dataset-modal.scss"></style>

<script lang="ts" src="./dataset-modal.ts">
</script>
