<template>
<div class="bar">
  <b-button size="sm" variant="outline-secondary" @click="openDataModal">
    <i class="fas fa-database"></i>
  </b-button>
  <b-modal title="Dataset" v-model="dataModalVisible">
    <file-upload ref="fileUpload" url="/dataset/upload" field="dataset" @uploaded="onFileUpload"></file-upload>
    <div class="list">
      <h5>Your Datasets</h5>
      <dataset-list ref="datasetList" selectable></dataset-list>
    </div>
    <!-- no footer buttons because one cannot select dataset here -->
    <div slot="modal-footer"></div>
    <!--
      <b-btn class="float-right" variant="outline-secondary" @click="closeDataModal">Cancel</b-btn>
    -->
  </b-modal>
</div>
</template>
<style scoped src="./dataset-bar.scss"></style>
<script src="./dataset-bar.ts">
</script>
