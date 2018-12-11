<template>
<base-modal ref="modal" :title="title"
  :visible-state="saveAsDiagramModalVisible"
  :on-open="openSaveAsDiagramModal"
  :on-close="closeSaveAsDiagramModal"
  :on-enter="saveAsDiagram"
  >
  <template slot="content">
    <b-container fluid>
      <b-row>
        <b-col sm="4" class="input-label">Diagram Name</b-col>
        <b-col sm="8"><b-form-input type="text" v-model="diagramName"></b-form-input></b-col>
      </b-row>
    </b-container>
  </template>
  <template slot="footer">
    <b-btn variant="outline-secondary" @click="$refs.modal.close()">Cancel</b-btn>
    <b-btn variant="outline-success" @click="saveAsDiagram" :disabled="!diagramName">OK</b-btn>
  </template>
</base-modal>
</template>

<script lang="ts" src="./save-as-diagram-modal.ts">
</script>
