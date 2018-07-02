<template>
<div class="bar">
  <b-button size="sm" variant="outline-secondary" @click="openDataModal">
    <i class="fas fa-database"></i>
  </b-button>
  <b-modal title="Dataset" v-model="dataModalVisible">
    <file-upload ref="fileUpload" url="/dataset/upload" field="dataset"></file-upload>
    <div slot="modal-footer">
      <b-btn class="float-right" variant="outline-secondary" @click="closeDataModal">Cancel</b-btn>
    </div>
  </b-modal>
</div>
</template>
<style scoped src="./dataset-bar.scss"></style>
<script src="./dataset-bar.ts">
</script>
