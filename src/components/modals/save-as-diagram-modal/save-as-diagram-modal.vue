<template>
<b-modal title="Save Diagram" v-model="modalVisible">
  <b-container fluid>
    <b-row>
      <b-col sm="4" class="label">Diagram Name</b-col>
      <b-col sm="8"><b-form-input type="text" v-model="diagramName"></b-form-input></b-col>
    </b-row>
  </b-container>
  <div slot="modal-footer">
    <div class="float-right">
      <b-btn variant="outline-secondary" @click="close">Cancel</b-btn>
      <b-btn variant="outline-success" @click="dispatchSaveAsDiagram" :disabled="!diagramName">OK</b-btn>
    </div>
  </div>
</b-modal>
</template>

<style scoped lang="scss">
@import '../../../common/style/index';
.label {
  @extend %input-label;
}
</style>

<script src="./save-as-diagram-modal.ts">
</script>
