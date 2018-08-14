<template>
<b-nav-item-dropdown text="Diagram">
  <b-dropdown-item @click="openNewDiagramModal">
    <i class="fas fa-sm fa-file"></i>New
    <span class="shortcut">{{osCtrlKeyChar}}N</span>
  </b-dropdown-item>
  <b-dropdown-item @click="saveDiagram" :disabled="!username">
    <i class="fas fa-sm fa-upload"></i>Save
    <span class="shortcut">{{osCtrlKeyChar}}S</span>
  </b-dropdown-item>
  <b-dropdown-item @click="openSaveAsDiagramModal" :disabled="!username">
    <i class="fas fa-sm fa-save"></i>Save As
    <span class="shortcut">{{osCtrlKeyChar}}⇧S</span>
  </b-dropdown-item>
  <b-dropdown-item @click="openLoadDiagramModal">
    <i class="fas fa-sm fa-arrow-alt-circle-down"></i>Load
    <span class="shortcut">{{osCtrlKeyChar}}L</span>
  </b-dropdown-item>
</b-nav-item-dropdown>
</template>

<script lang="ts" src="./diagram-menu.ts">
</script>
