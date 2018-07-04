<template>
<b-modal title="Dataset" v-model="modalVisible">
  <file-upload ref="fileUpload" url="/dataset/upload" field="dataset" @uploaded="onFileUpload"></file-upload>
  <div class="list">
    <h5>Your Datasets</h5>
    <dataset-list ref="datasetList" :selectable="selectable"
      @selectDataset="onDatasetListSelect"
      @deselectDataset="onDatasetListDeselect"
    ></dataset-list>
  </div>
  <div slot="modal-footer">
    <div v-if="selectable" class="float-right">
      <b-btn variant="outline-secondary" @click="close">Cancel</b-btn>
      <b-btn variant="outline-success" @click="selectDataset" :disabled="!datasetSelected">OK</b-btn>
    </div>
  </div>
</b-modal>
</template>

<style scoped src="./dataset-panel.scss"></style>

<script src="./dataset-panel.ts">
</script>
