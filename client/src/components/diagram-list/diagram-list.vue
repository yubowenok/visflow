<template>
<div>
  <div v-if="errorMessage" class="modal-message error">{{ errorMessage }}</div>
  <data-table ref="table"
    :config="tableConfig"
    @selectRow="onDiagramSelect"
    @deselectRow="onDiagramDeselect"
  ></data-table>
</div>
</template>

<script lang="ts" src="./diagram-list.ts">
</script>
