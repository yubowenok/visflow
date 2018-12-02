<template>
<base-modal ref="modal" :title="isInExperiment ? 'Clear Diagram' : 'New Diagram'"
  :visible-state="newDiagramModalVisible"
  :on-open="openNewDiagramModal"
  :on-close="closeNewDiagramModal"
  :on-enter="newDiagram"
>
  <template slot="content">
    <div v-if="!isInExperiment">
      Are you sure you want to create a new diagram?
      Unsaved work will be lost.
    </div>
    <div v-else>
      Are you sure you want to clear the diagram?
    </div>
  </template>
  <template slot="footer">
    <b-btn variant="outline-secondary" @click="$refs.modal.close()">Cancel</b-btn>
    <b-btn variant="outline-success" @click="newDiagram">OK</b-btn>
  </template>
</base-modal>
</template>

<script lang="ts" src="./new-diagram-modal.ts">
</script>
