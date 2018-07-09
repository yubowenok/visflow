<template>
  <b-modal title="New Diagram" v-model="modalVisible">
    <div>
      Are you sure you want to create a new diagram?
      Unsaved work will be lost.
    </div>
    <div slot="modal-footer">
      <div class="float-right">
        <b-btn variant="outline-secondary" @click="close">Cancel</b-btn>
        <b-btn variant="outline-success" @click="dispatchNewDiagram">OK</b-btn>
      </div>
    </div>
  </b-modal>
</template>

<script src="./new-diagram-modal.ts">
</script>
