<template>
<div>
  <div v-if="errorMessage" class="modal-message error">{{ errorMessage }}</div>
  <data-table ref="table" id="table"
    :config="tableConfig"
    @selectRow="onDiagramSelect"
    @deselectRow="onDiagramDeselect"
  ></data-table>
</div>
</template>

<style scoped lang="scss">
@import '../../common/style/index';
// #table {
//   /deep/ .form-control[type=search] {
//     width: $modal-datatables-search-width;
//   }
// }
</style>

<script lang="ts" src="./diagram-list.ts">
</script>
