<template>
<b-nav-item-dropdown text="Diagram">
  <b-dropdown-item @click="openNewDiagramModal">
    <i class="fas fa-sm fa-file"></i>New
  </b-dropdown-item>
  <b-dropdown-item @click="saveDiagram" :disabled="!username">
    <i class="fas fa-sm fa-upload"></i>Save
  </b-dropdown-item>
  <b-dropdown-item @click="openSaveAsDiagramModal" :disabled="!username">
    <i class="fas fa-sm fa-save"></i>Save As
  </b-dropdown-item>
  <b-dropdown-item @click="openLoadDiagramModal">
    <i class="fas fa-sm fa-arrow-alt-circle-down"></i>Load
  </b-dropdown-item>
</b-nav-item-dropdown>
</template>

<script src="./diagram-menu.ts">
</script>
