<template>
<base-modal ref="modal" title="Load Diagram"
  :visible-state="loadDiagramModalVisible"
  :on-open="openLoadDiagramModal"
  :on-close="closeLoadDiagramModal"
  >
  <template slot="content">
    <h5>Your Diagrams</h5>
    <diagram-list ref="diagramList" class="list"
      @selectDiagram="onDiagramListSelect"
      @deselectDiagram="onDiagramListDeselect">
    </diagram-list>
  </template>
  <template slot="footer">
    <b-btn variant="outline-secondary" @click="$refs.modal.close()">Cancel</b-btn>
    <b-btn variant="outline-success" @click="loadDiagram" :disabled="!selectedDiagram">OK</b-btn>
  </template>
</base-modal>
</template>

<script src="./load-diagram-modal.ts">
</script>
