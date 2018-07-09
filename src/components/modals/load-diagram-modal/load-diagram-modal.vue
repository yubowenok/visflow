<template>
<b-modal title="Load Diagram" v-model="modalVisible">
  <div>
    Load diagram?
  </div>
  <div slot="modal-footer">
    <div class="float-right">
      <b-btn variant="outline-secondary" @click="close">Cancel</b-btn>
      <b-btn variant="outline-success" @click="dispatchLoadDiagram">OK</b-btn>
    </div>
  </div>
</b-modal>
</template>

<script src="./load-diagram-modal.ts">
</script>
