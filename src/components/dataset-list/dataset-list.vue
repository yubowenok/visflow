<template>
<div>
  <div v-if="errorMessage" class="modal-message error">{{ errorMessage }}</div>
  <data-table ref="table"
    :config="tableConfig"
  ></data-table>
</div>
</template>

<style scoped src="./dataset-list.scss"></style>

<script src="./dataset-list.ts">
</script>
