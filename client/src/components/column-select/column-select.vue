<template>
<div>
  <form-select id="select"
    v-model="selected"
    :clearable="clearable"
    :options="columns"
    @change="onListSelect">
    <span slot="no-options">No Matching Columns</span>
  </form-select>
</div>
</template>

<style scoped lang="scss" src="./column-select.scss"></style>

<script lang="ts" src="./column-select.ts">
</script>
