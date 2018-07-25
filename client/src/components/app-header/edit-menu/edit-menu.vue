<template>
<b-nav-item-dropdown text="Edit">
  <b-dropdown-item :disabled="!undoMessage" @click="undo">
    <i class="fas fa-sm fa-undo"></i>Undo <template v-if="undoMessage">"{{ undoMessage }}"</template>
    <span class="shortcut">Ctrl + Z</span>
  </b-dropdown-item>
  <b-dropdown-item :disabled="!redoMessage" @click="redo">
    <i class="fas fa-sm fa-redo"></i>Redo <template v-if="redoMessage">"{{ redoMessage }}"</template>
    <span class="shortcut">Ctrl + Shift + Z</span>
  </b-dropdown-item>
  <!--
  <b-dropdown-item><i class="fas fa-sm fa-search-minus"></i>Minimize Non-Visualizations</b-dropdown-item>
  -->
  <b-dropdown-item><i class="fas fa-sm fa-th"></i>Apply Automatic Layout</b-dropdown-item>
</b-nav-item-dropdown>
</template>

<script lang="ts" src="./edit-menu.ts">
</script>
