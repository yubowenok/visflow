<template>
<div>
  <div v-if="errorMessage" class="modal-message error">{{ errorMessage }}</div>
  <data-table ref="table"
    :config="tableConfig"
    @selectRow="onDatasetSelect"
    @deselectRow="onDatasetDeselect"
  ></data-table>
</div>
</template>

<script src="./dataset-list.ts">
</script>
