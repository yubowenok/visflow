<template>
<b-nav-item-dropdown text="Diagram">
  <b-dropdown-item @click="newDiagram"><i class="fas fa-sm fa-file"></i>New</b-dropdown-item>
  <b-dropdown-item @click="saveDiagram"><i class="fas fa-sm fa-save"></i>Save</b-dropdown-item>
  <b-dropdown-item @click="loadDiagram"><i class="fas fa-sm fa-arrow-alt-circle-down"></i>Load</b-dropdown-item>
</b-nav-item-dropdown>
</template>

<script src="./diagram-menu.ts">
</script>
